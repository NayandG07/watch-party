#!/usr/bin/env python3
"""
Watch Party — Video Uploader
=============================
Transcodes a video to multi-quality AES-128 encrypted HLS and uploads it
to Backblaze B2 with parallel multi-part uploads.

Usage:
    python process.py /path/to/movie.mkv
    python process.py --api-url https://myserver.com /path/to/movie.mkv
    python process.py --workers 12 /path/to/movie.mkv   # more upload threads

Requirements: ffmpeg, ffprobe + Python packages in requirements.txt
"""

import argparse
import json
import os
import queue
import secrets
import shutil
import subprocess
import sys
import tempfile
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Optional

import boto3
import httpx
from boto3.s3.transfer import TransferConfig
from botocore.client import Config
from dotenv import load_dotenv
from supabase import create_client, Client

from rich.console import Console
from rich.live import Live
from rich.panel import Panel
from rich.progress import (
    BarColumn,
    DownloadColumn,
    MofNCompleteColumn,
    Progress,
    SpinnerColumn,
    TaskID,
    TextColumn,
    TimeElapsedColumn,
    TimeRemainingColumn,
    TransferSpeedColumn,
)
from rich.prompt import IntPrompt, Prompt
from rich.table import Table
from rich.text import Text

console = Console()

# ── Quality ladder ────────────────────────────────────────────────────────────
# Each entry: (label, height, max_bitrate_k, audio_bitrate_k, crf)
# Uses x265 (HEVC) with CRF mode for ~50% smaller files than x264
# HEVC CRF values: 28 ≈ x264 CRF 23, add ~5-6 for equivalent quality
QUALITY_LADDER = [
    ("1080p", 1080, 3500, 128, 26),   # max 3.5 Mbps, CRF 26 (high quality)
    # 720p removed per user request
    ("480p",  480,  1200, 96,  28),   # max 1.2 Mbps, CRF 28 (mobile)
    ("360p",  360,  600,  64,  30),   # max 600 kbps, CRF 30 (low bandwidth)
]

# x265/HEVC produces 40-50% smaller files than x264 at equivalent quality
# Trade-off: Encoding takes 3-5x longer, requires modern browsers (2016+)
# Maxrate acts as a ceiling to prevent bitrate spikes that would break streaming

# Multipart upload threshold: files larger than this use multipart (8 MB)
MULTIPART_THRESHOLD = 8 * 1024 * 1024
# Part size for multipart uploads (8 MB)
MULTIPART_CHUNKSIZE = 8 * 1024 * 1024


# ── Auth ───────────────────────────────────────────────────────────────────────

def init_supabase() -> Client:
    env_path = Path(__file__).parent / ".env"
    load_dotenv(dotenv_path=env_path)
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_ANON_KEY")
    if not url or not key:
        console.print("[red bold]Error:[/] SUPABASE_URL or SUPABASE_ANON_KEY not found in .env file.")
        console.print("Please create a [bold].env[/] file in the uploader directory.")
        sys.exit(1)
    return create_client(url, key)


def prompt_auth(supabase: Client) -> tuple[str, str, str]:
    """
    Authenticate and return (access_token, refresh_token, email).
    The refresh_token can be used to get a new access_token if it expires.
    """
    console.print("\n[bold cyan]Authentication[/]")
    email = Prompt.ask("Email")
    password = Prompt.ask("Password", password=True)
    with console.status("[cyan]Authenticating...", spinner="dots"):
        try:
            response = supabase.auth.sign_in_with_password({"email": email, "password": password})
            access_token = response.session.access_token
            refresh_token = response.session.refresh_token
        except Exception as e:
            console.print(f"[red bold]Authentication failed:[/] {e}")
            sys.exit(1)
    if not access_token or not refresh_token:
        console.print("[red bold]Error:[/] Missing tokens in login response.")
        sys.exit(1)
    return access_token, refresh_token, email


def refresh_access_token(supabase: Client, refresh_token: str) -> str:
    """
    Use the refresh_token to get a new access_token.
    Returns the new access_token.
    """
    try:
        response = supabase.auth.refresh_session(refresh_token)
        return response.session.access_token
    except Exception as e:
        console.print(f"[red bold]Token refresh failed:[/] {e}")
        console.print("[yellow]Please re-authenticate manually.[/]")
        sys.exit(1)


class BackendKeepAlive:
    """Keeps the backend (e.g. Render free tier) awake during long encodes/uploads."""

    def __init__(self, api_url: str, interval_seconds: int = 180):
        self.api_url = api_url.rstrip("/")
        self.interval = interval_seconds
        self._stop_event = threading.Event()
        self._thread: Optional[threading.Thread] = None

    def start(self):
        self._thread = threading.Thread(target=self._run, daemon=True, name="BackendKeepAlive")
        self._thread.start()

    def _run(self):
        while not self._stop_event.wait(self.interval):
            try:
                httpx.get(f"{self.api_url}/api/health", timeout=30.0)
            except Exception:
                pass

    def stop(self):
        self._stop_event.set()
        if self._thread:
            self._thread.join(timeout=2.0)


def verify_role(api_url: str, headers: dict) -> None:
    with console.status("[cyan]Verifying permissions...", spinner="dots"):
        try:
            resp = httpx.get(f"{api_url}/api/auth/me", headers=headers, timeout=30.0)
            resp.raise_for_status()
        except Exception as e:
            console.print(f"[red bold]Could not verify user role:[/] {e}")
            sys.exit(1)
    me = resp.json()
    role = me.get("role", "")
    if role not in ("level2", "super_admin"):
        console.print(f"[red bold]Insufficient permissions.[/] Role: '{role}'. Need 'level2' or 'super_admin'.")
        sys.exit(1)
    console.print(f"[green]✓ Logged in as[/] [bold]{me.get('username', me.get('email', 'unknown'))}[/] (role: [italic]{role}[/])")


def fetch_storage_provider(api_url: str, headers: dict) -> dict:
    with console.status("[cyan]Fetching storage providers...", spinner="dots"):
        resp = httpx.get(f"{api_url}/api/storage-providers", headers=headers, timeout=30.0)
    if resp.status_code != 200:
        console.print(f"[red bold]Failed to list storage providers:[/] {resp.text}")
        sys.exit(1)
    providers = resp.json()
    if not providers:
        console.print("[red bold]No storage bucket configured.[/] Add one in account settings.")
        sys.exit(1)
    if len(providers) == 1:
        chosen = providers[0]
    else:
        console.print("\n[bold]Available storage providers:[/]")
        for i, p in enumerate(providers, 1):
            console.print(f"  [cyan]{i}.[/] {p['name']} [dim]({p['provider_type']}) - {p['bucket_name']}[/]")
        choice = IntPrompt.ask("Select a provider", choices=[str(i) for i in range(1, len(providers) + 1)])
        chosen = providers[choice - 1]
    provider_id = chosen["id"]
    with console.status(f"[cyan]Fetching credentials for {chosen['name']}...", spinner="dots"):
        cred_resp = httpx.get(
            f"{api_url}/api/storage-providers/{provider_id}/credentials",
            headers=headers, timeout=30.0,
        )
    if cred_resp.status_code != 200:
        console.print(f"[red bold]Could not retrieve credentials:[/] {cred_resp.text}")
        sys.exit(1)
    creds = cred_resp.json()
    endpoint_url = creds.get("endpoint_url", "") or ""
    if endpoint_url and not endpoint_url.startswith("http"):
        endpoint_url = f"https://{endpoint_url}"
    provider_type = creds.get("provider_type", "b2")
    console.print(f"[green]✓ Connected to storage:[/] [bold]{chosen['name']}[/] [dim]({provider_type})[/]")
    return {
        "id": provider_id,
        "name": chosen["name"],
        "provider_type": provider_type,
        "bucket_name": creds["bucket_name"],
        "endpoint_url": endpoint_url,
        "access_key_id": creds["access_key_id"],
        "secret_access_key": creds["secret_access_key"],
    }


def fetch_collection(api_url: str, headers: dict) -> str:
    with console.status("[cyan]Fetching collections...", spinner="dots"):
        col_resp = httpx.get(f"{api_url}/api/collections", headers=headers, timeout=30.0)
    if col_resp.status_code != 200:
        console.print(f"[red bold]Failed to list collections:[/] {col_resp.text}")
        sys.exit(1)
    collections = col_resp.json()
    if not collections:
        console.print("[red bold]No collections found.[/] Create a library and collection in the web UI first.")
        sys.exit(1)
    if len(collections) == 1:
        chosen = collections[0]
        console.print(f"[green]✓ Auto-selected collection:[/] [bold]{chosen['name']}[/]")
        return chosen["id"]
    console.print("\n[bold]Available collections:[/]")
    for i, c in enumerate(collections, 1):
        console.print(f"  [cyan]{i}.[/] {c['name']}")
    choice = IntPrompt.ask("Select a collection", choices=[str(i) for i in range(1, len(collections) + 1)])
    return collections[choice - 1]["id"]


def create_movie_record(api_url: str, headers: dict, title: str, collection_id: str, provider_id: str) -> str:
    resp = httpx.post(
        f"{api_url}/api/movies",
        json={"collection_id": collection_id, "storage_provider_id": provider_id, "title": title},
        headers=headers, timeout=30.0,
    )
    if resp.status_code != 201:
        console.print(f"[red bold]Failed to create movie record:[/] {resp.text}")
        sys.exit(1)
    movie_id = resp.json()["id"]
    console.print(f"[green]✓ Created movie record:[/] {title} (id: {movie_id})")
    return movie_id


def build_s3_client(provider: dict):
    """Build a boto3 S3 client for any supported storage provider."""
    return boto3.client(
        "s3",
        endpoint_url=provider["endpoint_url"],
        aws_access_key_id=provider["access_key_id"],
        aws_secret_access_key=provider["secret_access_key"],
        config=Config(signature_version="s3v4", max_pool_connections=50),
    )


def configure_bucket_cors(s3_client, bucket_name: str) -> None:
    cors_configuration = {
        "CORSRules": [{
            "AllowedHeaders": ["*"],
            "AllowedMethods": ["GET", "HEAD", "OPTIONS"],
            "AllowedOrigins": ["*"],
            "ExposeHeaders": ["*"],
            "MaxAgeSeconds": 86400,
        }]
    }
    with console.status(f"[cyan]Configuring CORS for bucket {bucket_name}...", spinner="dots"):
        try:
            s3_client.put_bucket_cors(Bucket=bucket_name, CORSConfiguration=cors_configuration)
            console.print(f"[green]✓ CORS configured for bucket {bucket_name}[/]")
        except Exception as e:
            console.print(f"[yellow]Warning: Could not configure CORS: {e}[/]")


# ── Video probing ──────────────────────────────────────────────────────────────

def run_command(cmd: list[str], capture: bool = True) -> str:
    result = subprocess.run(
        cmd,
        stdout=subprocess.PIPE if capture else None,
        stderr=subprocess.PIPE,
        text=True,
    )
    if result.returncode != 0:
        console.print(f"[red bold]Command failed:[/]\n{result.stderr[-2000:]}")
        sys.exit(1)
    return result.stdout if capture else ""


def probe_video(file_path: Path) -> dict:
    output = run_command([
        "ffprobe", "-v", "quiet",
        "-print_format", "json",
        "-show_format", "-show_streams",
        str(file_path),
    ])
    return json.loads(output)


def should_copy_audio(probe_data: dict, target_bitrate_k: int) -> bool:
    """
    Determine if we can copy audio instead of re-encoding.
    Returns True if audio is already AAC and bitrate is acceptable.
    """
    audio_stream = next((s for s in probe_data.get("streams", []) if s.get("codec_type") == "audio"), {})
    codec = audio_stream.get("codec_name", "")
    bitrate = int(audio_stream.get("bit_rate", 0)) / 1000 if audio_stream.get("bit_rate") else 0
    
    # Copy if already AAC and bitrate is close to target (within 20% range)
    if codec == "aac" and bitrate > 0:
        target_min = target_bitrate_k * 0.8
        target_max = target_bitrate_k * 1.5
        if target_min <= bitrate <= target_max:
            return True
    return False


# ── Transcode with real-time progress ──────────────────────────────────────────

# Global lock for progress display to prevent Rich conflicts in parallel mode
_progress_lock = threading.Lock()

def transcode_with_progress(cmd: list[str], duration_seconds: float, label: str) -> None:
    """
    Run an ffmpeg command and show a real-time progress bar.

    Uses -progress pipe:1 for machine-readable progress on stdout.
    Stderr is drained in a background thread to prevent OS pipe buffer deadlocks.
    
    Note: In parallel mode, progress bars are disabled to avoid Rich display conflicts.
    """
    # Insert -progress pipe:1 -nostats before the output file (last arg)
    out_file = cmd[-1]
    progress_cmd = cmd[:-1] + ["-progress", "pipe:1", "-nostats", out_file]

    proc = subprocess.Popen(
        progress_cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        bufsize=1,
    )

    # ── Drain stderr in a background thread to prevent pipe buffer deadlock ──
    stderr_lines: list[str] = []

    def _drain_stderr() -> None:
        for line in proc.stderr:
            stderr_lines.append(line)

    stderr_thread = threading.Thread(target=_drain_stderr, daemon=True)
    stderr_thread.start()

    try:
        # Try to acquire lock - if can't (parallel mode), just process without display
        has_lock = _progress_lock.acquire(blocking=False)
        
        if has_lock:
            # Single encoding or first parallel thread - show progress bar
            progress = Progress(
                SpinnerColumn(),
                TextColumn("[bold cyan]{task.description}"),
                BarColumn(bar_width=40),
                TextColumn("[progress.percentage]{task.percentage:>3.0f}%"),
                TimeElapsedColumn(),
                TimeRemainingColumn(),
                console=console,
            )
            
            with progress:
                task = progress.add_task(label, total=100)

                for line in proc.stdout:
                    line = line.strip()
                    if line.startswith("out_time_ms="):
                        try:
                            ms = int(line.split("=")[1])
                            current_time = ms / 1_000_000
                            if duration_seconds > 0:
                                pct = min(100.0, (current_time / duration_seconds) * 100)
                                progress.update(task, completed=pct)
                        except (ValueError, IndexError):
                            pass
        else:
            # Parallel mode - other threads just drain stdout without display
            for line in proc.stdout:
                pass  # Just consume the output
                
    except KeyboardInterrupt:
        console.print("\n[yellow]Interrupted — stopping ffmpeg...[/]")
        proc.terminate()
        try:
            proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            proc.kill()
        sys.exit(0)
    finally:
        if has_lock:
            _progress_lock.release()

    proc.wait()
    stderr_thread.join(timeout=2)

    if proc.returncode != 0:
        last_err = "".join(stderr_lines[-30:])  # last 30 lines of ffmpeg output
        console.print(f"[red bold]ffmpeg failed (exit {proc.returncode}):[/]\n{last_err}")
        sys.exit(1)


# ── Multi-quality HLS encoding ─────────────────────────────────────────────────

def select_quality_ladder(source_width: Optional[int], source_height: Optional[int]) -> list[tuple]:
    """Return quality variants appropriate for the source resolution."""
    if not source_height and not source_width:
        return QUALITY_LADDER

    w = source_width or 0
    h = source_height or 0

    applicable = []
    for label, target_h, max_bitrate, abitrate, crf in QUALITY_LADDER:
        if target_h == 1080 and (h >= 900 or w >= 1800):
            applicable.append((label, target_h, max_bitrate, abitrate, crf))
        elif target_h == 480 and (h >= 400 or w >= 800):
            applicable.append((label, target_h, max_bitrate, abitrate, crf))
        elif target_h == 360 and (h >= 300 or w >= 500):
            applicable.append((label, target_h, max_bitrate, abitrate, crf))

    if not applicable:
        applicable = [("360p", 360, 600, 64, 30)]
    return applicable


def _encode_variant(
    input_path: Path,
    output_dir: Path,
    key_info_path: Path,
    label: str,
    height: int,
    max_bitrate: int,
    abitrate: int,
    crf: int,
    duration_seconds: float,
    probe_data: dict,
    preset: str = "medium",
    use_gpu: bool = False,
) -> tuple[str, int, int, Path]:
    """
    Encode a single quality variant. Designed to run in parallel.
    Returns: (label, height, max_bitrate, playlist_path)
    """
    variant_dir = output_dir / label
    variant_dir.mkdir(exist_ok=True)
    playlist_path = variant_dir / "playlist.m3u8"

    # Check if we can copy audio instead of re-encoding (faster + preserves quality)
    copy_audio = should_copy_audio(probe_data, abitrate)
    audio_desc = f"copy audio" if copy_audio else f"audio {abitrate}k"

    encoder_desc = "GPU (NVENC)" if use_gpu else f"HEVC CRF {crf}"
    console.print(f"\n[bold cyan]Encoding {label}[/] ({encoder_desc}, max {max_bitrate}k / {audio_desc})...")

    cmd = [
        "ffmpeg", "-y",
        "-i", str(input_path),
        "-map", "0:v:0",
        "-map", "0:a:0?",
    ]
    
    if use_gpu:
        # NVIDIA NVENC GPU encoding (5-10x faster)
        cmd += [
            "-c:v", "hevc_nvenc",
            "-preset", "p4",              # p1=fastest, p7=slowest (p4=balanced)
            "-tune", "hq",                # high quality mode
            "-rc", "vbr",                 # variable bitrate
            "-cq", str(crf + 5),          # quality level (NVENC scale different from x265)
            "-b:v", f"{max_bitrate}k",    # target bitrate
            "-maxrate", f"{max_bitrate}k",
            "-bufsize", f"{max_bitrate * 2}k",
            "-vf", f"scale=-2:'min({height},ih)'",
            "-pix_fmt", "yuv420p",
            "-tag:v", "hvc1",             # Apple compatibility
        ]
    else:
        # CPU encoding with x265
        cmd += [
            "-c:v", "libx265",
            "-preset", preset,
            "-crf", str(crf),
            "-maxrate", f"{max_bitrate}k",
            "-bufsize", f"{max_bitrate * 2}k",
            "-vf", f"scale=-2:'min({height},ih)'",
            "-pix_fmt", "yuv420p",
            "-tag:v", "hvc1",
            "-x265-params", "log-level=error",
        ]
    
    # Audio settings
    if copy_audio:
        cmd += ["-c:a", "copy"]  # copy audio without re-encoding
    else:
        cmd += [
            "-c:a", "aac",
            "-b:a", f"{abitrate}k",
            "-ac", "2",  # stereo
        ]
    
    # HLS settings
    cmd += [
        "-hls_time", "6",
        "-hls_playlist_type", "vod",
        "-hls_flags", "independent_segments",
        "-hls_key_info_file", str(key_info_path),
        "-hls_segment_filename", str(variant_dir / "seg_%04d.ts"),
        str(playlist_path),
    ]

    transcode_with_progress(cmd, duration_seconds, f"Encoding {label}")
    return (label, height, max_bitrate, playlist_path)


def process_video(input_path: Path, output_dir: Path, duration_seconds: float,
                  source_width: Optional[int], source_height: Optional[int], 
                  probe_data: dict, parallel: bool = True, preset: str = "medium", use_gpu: bool = False) -> dict:
    """
    Transcode input video into multi-quality AES-128 encrypted HLS.

    Args:
        parallel: If True, encode all quality variants simultaneously (faster on multi-core CPUs)
        preset: x265 encoding preset (ultrafast to veryslow)
        use_gpu: If True, use NVIDIA NVENC for GPU encoding (5-10x faster)

    Output structure:
        output_dir/
            master.m3u8          ← true HLS master playlist
            enc.key              ← raw AES-128 key bytes
            key_info.txt         ← ffmpeg key info file
            1080p/
                playlist.m3u8
                seg_000.ts  ...
            480p/
                playlist.m3u8
                seg_000.ts  ...
            ...
    """
    output_dir.mkdir(parents=True, exist_ok=True)

    # Generate ONE key shared across all quality variants.
    # The player only needs one key to decrypt all variants.
    hls_key_hex = secrets.token_hex(16)
    hls_iv_hex = secrets.token_hex(16)

    key_file_path = output_dir / "enc.key"
    key_info_path = output_dir / "key_info.txt"

    with open(key_file_path, "wb") as f:
        f.write(bytes.fromhex(hls_key_hex))

    with open(key_info_path, "w") as f:
        f.write(f"watchparty://key\n{key_file_path.absolute()}\n{hls_iv_hex}\n")

    ladder = select_quality_ladder(source_width, source_height)
    console.print(f"\n[bold]Quality variants to encode:[/] {', '.join(q[0] for q in ladder)}")
    
    if parallel and len(ladder) > 1:
        console.print(f"[bold green]Parallel encoding enabled[/] - encoding {len(ladder)} variants simultaneously")

    variant_playlists = []  # list of (label, height, bitrate_k, playlist_path)

    # ── Encode variants (parallel or sequential) ───────────────────────────────
    if parallel and len(ladder) > 1:
        # Parallel encoding: all variants at once (uses more CPU, faster overall)
        console.print("[dim]Note: Progress bars disabled in parallel mode to avoid display conflicts[/]\n")
        
        with ThreadPoolExecutor(max_workers=len(ladder)) as executor:
            futures = {
                executor.submit(
                    _encode_variant,
                    input_path, output_dir, key_info_path,
                    label, height, max_bitrate, abitrate, crf,
                    duration_seconds, probe_data, preset, use_gpu
                ): label
                for label, height, max_bitrate, abitrate, crf in ladder
            }
            
            for future in as_completed(futures):
                label = futures[future]
                try:
                    result = future.result()
                    variant_playlists.append(result)
                    console.print(f"[green]✓ {label} encoding complete[/]")
                except Exception as exc:
                    console.print(f"[red bold]Encoding failed for {label}:[/] {exc}")
                    sys.exit(1)
        
        # Sort by quality (1080p first)
        variant_playlists.sort(key=lambda x: x[1], reverse=True)
    else:
        # Sequential encoding: one variant at a time (less CPU usage)
        for label, height, max_bitrate, abitrate, crf in ladder:
            result = _encode_variant(
                input_path, output_dir, key_info_path,
                label, height, max_bitrate, abitrate, crf,
                duration_seconds, probe_data, preset, use_gpu
            )
            variant_playlists.append(result)

    # ── Generate true HLS master playlist ─────────────────────────────────────
    master_path = output_dir / "master.m3u8"
    with open(master_path, "w") as f:
        f.write("#EXTM3U\n")
        f.write("#EXT-X-VERSION:3\n\n")
        for label, height, max_bitrate, playlist_path in variant_playlists:
            bandwidth = max_bitrate * 1000  # convert kbps to bps
            if source_width and source_height:
                aspect = source_width / source_height
                width = int(height * aspect)
            else:
                width = int(height * 16 / 9)
            if width % 2 != 0:
                width += 1
            f.write(f'#EXT-X-STREAM-INF:BANDWIDTH={bandwidth},RESOLUTION={width}x{height},NAME="{label}"\n')
            f.write(f"{label}/playlist.m3u8\n")

    console.print(f"\n[green]✓ Master playlist written with {len(variant_playlists)} variant(s)[/]")

    # ── Generate poster and backdrop ───────────────────────────────────────────
    console.print("\n[cyan]Generating poster and backdrop...[/]")
    poster_path = output_dir / "poster.jpg"
    backdrop_path = output_dir / "backdrop.jpg"

    run_command(["ffmpeg", "-y", "-ss", "00:00:05", "-i", str(input_path),
                 "-map", "0:v:0",
                 "-vframes", "1", "-q:v", "2", "-vf", "scale=1280:-2", str(poster_path)])
    run_command(["ffmpeg", "-y", "-ss", "00:00:10", "-i", str(input_path),
                 "-map", "0:v:0",
                 "-vframes", "1", "-q:v", "2", "-vf", "scale=1920:-2", str(backdrop_path)])

    console.print("[green]✓ Poster and backdrop generated[/]")

    return {
        "hls_key_hex": hls_key_hex,
        "hls_iv_hex": hls_iv_hex,
        "master_playlist": master_path,
        "poster_path": poster_path,
        "backdrop_path": backdrop_path,
        "variant_dirs": [output_dir / label for label, *_ in variant_playlists],
    }


# ── Parallel upload ────────────────────────────────────────────────────────────

def _upload_one(
    file_path: Path,
    s3_key: str,
    s3_client,
    bucket_name: str,
    overall_progress: Progress,
    overall_task: TaskID,
    bytes_progress: Progress,
    bytes_task: TaskID,
    lock: threading.Lock,
) -> None:
    """Upload a single file using multipart where appropriate."""
    file_size = file_path.stat().st_size

    transfer_config = TransferConfig(
        multipart_threshold=MULTIPART_THRESHOLD,
        multipart_chunksize=MULTIPART_CHUNKSIZE,
        max_concurrency=4,      # per-file internal concurrency
        use_threads=True,
    )

    def _callback(bytes_transferred: int) -> None:
        with lock:
            overall_progress.update(bytes_task, advance=bytes_transferred)

    s3_client.upload_file(
        str(file_path), bucket_name, s3_key,
        Callback=_callback,
        Config=transfer_config,
    )
    with lock:
        overall_progress.update(overall_task, advance=1)


def upload_files_parallel(
    files: list[tuple[Path, str]],   # (local_path, s3_key)
    s3_client,
    bucket_name: str,
    max_workers: int = 8,
) -> None:
    """Upload all files in parallel, showing real-time progress."""

    total_bytes = sum(f.stat().st_size for f, _ in files)
    total_files = len(files)

    progress = Progress(
        SpinnerColumn(),
        TextColumn("[bold yellow]{task.description}"),
        BarColumn(bar_width=38),
        MofNCompleteColumn(),
        TextColumn("·"),
        DownloadColumn(),
        TextColumn("@"),
        TransferSpeedColumn(),
        TimeRemainingColumn(),
        console=console,
    )

    lock = threading.Lock()

    with progress:
        file_task = progress.add_task(f"[bold yellow]Files", total=total_files)
        byte_task = progress.add_task("[bold cyan]Bytes", total=total_bytes)

        with ThreadPoolExecutor(max_workers=max_workers) as pool:
            futures = {
                pool.submit(
                    _upload_one,
                    file_path, s3_key, s3_client, bucket_name,
                    progress, file_task, progress, byte_task, lock,
                ): (file_path, s3_key)
                for file_path, s3_key in files
            }

            for future in as_completed(futures):
                file_path, s3_key = futures[future]
                try:
                    future.result()
                except Exception as exc:
                    console.print(f"[red bold]Upload failed:[/] {file_path.name} → {exc}")
                    # Cancel remaining and exit
                    for f in futures:
                        f.cancel()
                    sys.exit(1)


# ── Main ───────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Watch Party — Multi-quality video uploader",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="Example:\n  python process.py /path/to/Inception.mkv\n  python process.py --workers 12 /path/to/movie.mp4",
    )
    parser.add_argument("input_file", type=str, help="Path to the video file")
    parser.add_argument("--api-url", default="https://watch-party-u7jq.onrender.com", metavar="URL")
    parser.add_argument("--workers", type=int, default=8, metavar="N",
                        help="Parallel upload threads (default: 8, max recommended: 16)")
    parser.add_argument("--parallel", action="store_true", default=True,
                        help="Encode all quality variants simultaneously (default: enabled, faster on multi-core CPUs)")
    parser.add_argument("--sequential", action="store_true",
                        help="Encode quality variants one at a time (uses less CPU)")
    parser.add_argument("--preset", type=str, default="medium", 
                        choices=["ultrafast", "superfast", "veryfast", "faster", "fast", "medium", "slow", "slower", "veryslow"],
                        help="x265 encoding preset: faster = larger files, slower = smaller files (default: medium)")
    parser.add_argument("--gpu", action="store_true",
                        help="Use NVIDIA GPU encoding (NVENC) - 5-10x faster, requires RTX GPU")
    args = parser.parse_args()
    api_url = args.api_url.rstrip("/")
    
    # Determine parallel encoding mode
    parallel_encode = not args.sequential

    console.print(f"\n[bold magenta]Watch Party — Video Uploader[/]")
    console.print(f"Backend: [underline]{api_url}[/]")
    console.print(f"Upload workers: [bold]{args.workers}[/]")
    if args.gpu:
        console.print(f"Encoding: [bold green]GPU (NVENC)[/]")
    else:
        console.print(f"Encoding preset: [bold]{args.preset}[/]")
    console.print(f"Parallel encoding: [bold]{'Yes' if parallel_encode else 'No'}[/]\n")

    input_path = Path(args.input_file).resolve()
    if not input_path.exists():
        console.print(f"[red bold]Error:[/] File not found: {input_path}")
        sys.exit(1)

    # ── Step 1: Auth ──────────────────────────────────────────────────────────
    supabase = init_supabase()
    access_token, refresh_token, email = prompt_auth(supabase)
    headers = {"Authorization": f"Bearer {access_token}"}
    verify_role(api_url, headers)

    # ── Step 2: Storage provider ──────────────────────────────────────────────
    provider = fetch_storage_provider(api_url, headers)
    s3_client = build_s3_client(provider)
    configure_bucket_cors(s3_client, provider["bucket_name"])

    # ── Step 3: Collection & movie record ─────────────────────────────────────
    collection_id = fetch_collection(api_url, headers)
    default_title = input_path.stem.replace(".", " ").replace("_", " ").replace("-", " ").title()
    title = Prompt.ask("Movie title", default=default_title)
    movie_id = create_movie_record(api_url, headers, title, collection_id, provider["id"])
    console.print()

    # ── Step 4: Probe source ──────────────────────────────────────────────────
    console.print(f"[cyan]Probing {input_path.name}...[/]")
    probe = probe_video(input_path)

    video_stream = next((s for s in probe.get("streams", []) if s.get("codec_type") == "video"), {})
    fmt = probe.get("format", {})
    duration_seconds = float(fmt.get("duration", 0))
    codec = video_stream.get("codec_name")
    source_width = video_stream.get("width")
    source_height = video_stream.get("height")
    file_size_bytes = int(fmt.get("size", 0)) or None

    h = int(duration_seconds // 3600)
    m = int((duration_seconds % 3600) // 60)
    s = int(duration_seconds % 60)
    console.print(f"  Duration:   [bold]{h:02d}:{m:02d}:{s:02d}[/]")
    console.print(f"  Resolution: [bold]{source_width}x{source_height}[/]")
    console.print(f"  Codec:      [bold]{codec}[/]")

    output_dir = Path(tempfile.mkdtemp(prefix=f"watchparty_{movie_id}_"))

    # Start background keep-alive so Render backend does not sleep during transcode & upload
    keepalive = BackendKeepAlive(api_url, interval_seconds=180)
    keepalive.start()

    try:
        # ── Step 5: Transcode ─────────────────────────────────────────────────────
        console.rule("[bold magenta]Transcoding")
        result = process_video(input_path, output_dir, duration_seconds, source_width, source_height, probe, parallel_encode, args.preset, args.gpu)

        hls_key_hex = result["hls_key_hex"]
        hls_iv_hex = result["hls_iv_hex"]
        poster_path: Path = result["poster_path"]
        backdrop_path: Path = result["backdrop_path"]

        console.print(f"\n[bold green]✓ Transcoding complete![/]\n")

        # ── Step 6: Collect files to upload ──────────────────────────────────────
        base_key = f"movies/{movie_id}"
        files_to_upload: list[tuple[Path, str]] = []

        # master.m3u8
        files_to_upload.append((output_dir / "master.m3u8", f"{base_key}/hls/master.m3u8"))

        # enc.key
        enc_key = output_dir / "enc.key"
        if enc_key.exists():
            files_to_upload.append((enc_key, f"{base_key}/enc.key"))

        # Variant playlists + segments
        for variant_dir in result["variant_dirs"]:
            variant_name = variant_dir.name  # e.g. "1080p"
            for f in sorted(variant_dir.iterdir()):
                s3_key = f"{base_key}/hls/{variant_name}/{f.name}"
                files_to_upload.append((f, s3_key))

        # Images
        files_to_upload.append((poster_path, f"{base_key}/poster.jpg"))
        files_to_upload.append((backdrop_path, f"{base_key}/backdrop.jpg"))

        total_size_mb = sum(f.stat().st_size for f, _ in files_to_upload) / (1024 * 1024)
        console.rule("[bold magenta]Uploading")
        console.print(f"Files: [bold]{len(files_to_upload)}[/]  |  Total: [bold]{total_size_mb:.1f} MB[/]  |  Workers: [bold]{args.workers}[/]\n")

        # ── Step 7: Parallel upload ────────────────────────────────────────────────
        upload_files_parallel(files_to_upload, s3_client, provider["bucket_name"], max_workers=args.workers)
        console.print("\n[green]✓ All files uploaded successfully.[/]")
    finally:
        keepalive.stop()

    # ── Step 8: Notify API ────────────────────────────────────────────────────
    console.rule("[bold magenta]Finalizing")
    patch_payload = {
        "duration_seconds": duration_seconds,
        "hls_master_path": f"{base_key}/hls/master.m3u8",
        "poster_path": f"{base_key}/poster.jpg",
        "backdrop_path": f"{base_key}/backdrop.jpg",
        "hls_key_hex": hls_key_hex,
        "hls_iv_hex": hls_iv_hex,
        "is_processed": True,
        "is_uploaded": True,
    }
    if codec:           patch_payload["codec"] = codec
    if source_width:    patch_payload["resolution_width"] = source_width
    if source_height:   patch_payload["resolution_height"] = source_height
    if file_size_bytes: patch_payload["file_size_bytes"] = file_size_bytes

    # Ensure backend is awake (health check)
    with console.status("[cyan]Verifying backend connectivity...", spinner="dots"):
        for attempt in range(1, 4):
            try:
                httpx.get(f"{api_url}/api/health", timeout=90.0)
                break
            except Exception:
                if attempt < 3:
                    time.sleep(3)

    # Proactively refresh token if needed
    try:
        access_token = refresh_access_token(supabase, refresh_token)
        headers = {"Authorization": f"Bearer {access_token}"}
    except Exception:
        pass

    updated_movie = None
    with console.status("[cyan]Notifying API...", spinner="dots"):
        for attempt in range(1, 4):
            try:
                patch_resp = httpx.patch(
                    f"{api_url}/api/movies/{movie_id}/upload-complete",
                    json=patch_payload,
                    headers=headers,
                    timeout=120.0,
                )
                
                # If we get a 401 (unauthorized) or token error, refresh the token and retry
                if patch_resp.status_code == 401 or (patch_resp.status_code == 422 and "token" in patch_resp.text.lower()):
                    console.print("[yellow]Token expired. Refreshing authentication...[/]")
                    access_token = refresh_access_token(supabase, refresh_token)
                    headers = {"Authorization": f"Bearer {access_token}"}
                    patch_resp = httpx.patch(
                        f"{api_url}/api/movies/{movie_id}/upload-complete",
                        json=patch_payload,
                        headers=headers,
                        timeout=120.0,
                    )

                if patch_resp.status_code == 200:
                    updated_movie = patch_resp.json()
                    break
                else:
                    console.print(f"[yellow]API responded with status {patch_resp.status_code}: {patch_resp.text}[/]")
            except httpx.TimeoutException:
                console.print(f"[yellow]Finalize request timed out (attempt {attempt}/3). Retrying in 5s...[/]")
                time.sleep(5)
            except Exception as e:
                console.print(f"[yellow]Request error: {e} (attempt {attempt}/3). Retrying in 5s...[/]")
                time.sleep(5)

    if not updated_movie:
        console.print(f"\n[red bold]Failed to update movie record via API.[/]")
        console.print("[yellow]All video and asset files WERE uploaded successfully to storage![/]")
        console.print(f"[yellow]Your upload is safe in Backblaze B2 and temp folder: {output_dir}[/]")
        console.print(f"\n[cyan bold]To finalize without re-uploading, run:[/]")
        console.print(
            f"[green]python finalize_upload.py {movie_id} "
            f"--duration {duration_seconds} "
            f"--width {source_width or 0} "
            f"--height {source_height or 0} "
            f"--codec {codec or ''} "
            f"--file-size {file_size_bytes or 0} "
            f"--key {hls_key_hex} "
            f"--iv {hls_iv_hex}[/]\n"
        )
        sys.exit(1)

    console.print(f"\n[bold green]✨ Done![/] [italic]'{updated_movie.get('title', movie_id)}'[/] is live.")
    shutil.rmtree(output_dir, ignore_errors=True)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        console.print("\n[yellow]Aborted.[/]")
        sys.exit(0)
