#!/usr/bin/env python3
"""
Watch Party — Video Uploader
=============================
Usage:
    python process.py /path/to/movie.mkv

That's it! The script will authenticate you via Supabase (requires .env),
then guide you through picking a collection and confirming the title.
No UUIDs, no config files, no technical knowledge needed.

To connect to a remote server:
    python process.py --api-url https://myserver.com /path/to/movie.mkv

Requirements: ffmpeg, ffprobe + Python packages in requirements.txt
"""

import json
import os
import secrets
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path
import argparse

import boto3
import httpx
from botocore.client import Config
from dotenv import load_dotenv
from supabase import create_client, Client

from rich.console import Console
from rich.prompt import Prompt, IntPrompt
from rich.progress import (
    Progress,
    SpinnerColumn,
    TextColumn,
    BarColumn,
    DownloadColumn,
    TransferSpeedColumn,
    TimeRemainingColumn,
)

console = Console()

# ── Auth helpers ───────────────────────────────────────────────────────────────

def init_supabase() -> Client:
    """Initialize Supabase client from .env configuration."""
    env_path = Path(__file__).parent / ".env"
    load_dotenv(dotenv_path=env_path)
    
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_ANON_KEY")
    
    if not url or not key:
        console.print("[red bold]Error:[/] SUPABASE_URL or SUPABASE_ANON_KEY not found in .env file.")
        console.print("Please create a [bold].env[/] file in the uploader directory with your Supabase credentials.")
        sys.exit(1)
        
    return create_client(url, key)


def prompt_auth(supabase: Client) -> str:
    """Prompt for username and password, return a valid JWT access token from Supabase.
    """
    console.print("\n[bold cyan]Authentication[/]")
    email = Prompt.ask("Email")
    password = Prompt.ask("Password", password=True)

    with console.status("[cyan]Authenticating with Supabase...", spinner="dots"):
        try:
            response = supabase.auth.sign_in_with_password({"email": email, "password": password})
            access_token = response.session.access_token
        except Exception as e:
            console.print(f"[red bold]Authentication failed:[/] {e}")
            sys.exit(1)

    if not access_token:
        console.print("[red bold]Error:[/] No access_token in login response.")
        sys.exit(1)

    return access_token


def verify_role(api_url: str, headers: dict) -> None:
    """Verify the authenticated user has level2 or super_admin role."""
    with console.status("[cyan]Verifying role permissions...", spinner="dots"):
        try:
            resp = httpx.get(f"{api_url}/api/auth/me", headers=headers, timeout=30.0)
            resp.raise_for_status()
        except Exception as e:
            console.print(f"[red bold]Could not verify user role:[/] {e}")
            sys.exit(1)

    me = resp.json()
    role = me.get("role", "")
    if role not in ("level2", "super_admin"):
        console.print(f"[red bold]Insufficient permissions.[/] Your role is '{role}'. You need 'level2' or 'super_admin'.")
        sys.exit(1)

    console.print(f"[green]✓ Logged in as[/] [bold]{me.get('username', me.get('email', 'unknown'))}[/] (role: [italic]{role}[/])")


def fetch_storage_provider(api_url: str, headers: dict) -> dict:
    """Fetch storage provider credentials from the API."""
    with console.status("[cyan]Fetching storage providers...", spinner="dots"):
        resp = httpx.get(f"{api_url}/api/storage-providers", headers=headers, timeout=30.0)
        
    if resp.status_code != 200:
        console.print(f"[red bold]Failed to list storage providers:[/] {resp.text}")
        sys.exit(1)

    providers = resp.json()
    if not providers:
        console.print(f"[red bold]No storage bucket configured.[/] Please add one in your account settings.")
        sys.exit(1)

    if len(providers) == 1:
        chosen = providers[0]
    else:
        console.print("\n[bold]Available storage providers:[/]")
        for i, p in enumerate(providers, start=1):
            console.print(f"  [cyan]{i}.[/] {p['name']} [dim]({p['provider_type']}) - {p['bucket_name']}[/]")
        
        choice = IntPrompt.ask("Select a provider", choices=[str(i) for i in range(1, len(providers) + 1)])
        chosen = providers[choice - 1]

    provider_id = chosen["id"]

    with console.status(f"[cyan]Decrypting credentials for {chosen['name']}...", spinner="dots"):
        cred_resp = httpx.get(
            f"{api_url}/api/storage-providers/{provider_id}/credentials",
            headers=headers,
            timeout=30.0,
        )
        
    if cred_resp.status_code != 200:
        console.print(f"[red bold]Could not retrieve credentials:[/] {cred_resp.text}")
        sys.exit(1)

    creds = cred_resp.json()
    endpoint_url = creds.get("endpoint_url", "")
    if endpoint_url and not endpoint_url.startswith("http"):
        endpoint_url = f"https://{endpoint_url}"
        
    console.print(f"[green]✓ Connected to storage:[/] [bold]{chosen['name']}[/]")
    return {
        "id": provider_id,
        "name": chosen["name"],
        "bucket_name": creds["bucket_name"],
        "endpoint_url": endpoint_url,
        "key_id": creds["key_id"],
        "application_key": creds["application_key"],
    }


def fetch_collection(api_url: str, headers: dict) -> str:
    """List all available collections and let the user pick one."""
    with console.status("[cyan]Fetching collections...", spinner="dots"):
        col_resp = httpx.get(f"{api_url}/api/collections", headers=headers, timeout=30.0)
        
    if col_resp.status_code != 200:
        console.print(f"[red bold]Failed to list collections:[/] {col_resp.text}")
        sys.exit(1)

    collections = col_resp.json()

    if not collections:
        console.print("[red bold]No collections found.[/] Please create a library and collection in the web UI first.")
        sys.exit(1)

    if len(collections) == 1:
        chosen = collections[0]
        console.print(f"[green]✓ Auto-selected collection:[/] [bold]{chosen['name']}[/]")
        return chosen["id"]

    console.print("\n[bold]Available collections:[/]")
    for i, c in enumerate(collections, start=1):
        console.print(f"  [cyan]{i}.[/] {c['name']}")
        
    choice = IntPrompt.ask("Select a collection", choices=[str(i) for i in range(1, len(collections) + 1)])
    return collections[choice - 1]["id"]


def create_movie_record(api_url: str, headers: dict, title: str, collection_id: str, provider_id: str) -> str:
    """Create the initial movie record in the database."""
    payload = {
        "collection_id": collection_id,
        "storage_provider_id": provider_id,
        "title": title
    }
    resp = httpx.post(
        f"{api_url}/api/movies",
        json=payload,
        headers=headers,
        timeout=30.0,
    )
    if resp.status_code != 201:
        console.print(f"[red bold]Failed to create movie record:[/] {resp.text}")
        sys.exit(1)

    movie_id = resp.json()["id"]
    console.print(f"[green]✓ Created movie record:[/] {title} (id: {movie_id})")
    return movie_id


def build_s3_client(provider: dict):
    return boto3.client(
        "s3",
        endpoint_url=provider["endpoint_url"],
        aws_access_key_id=provider["key_id"],
        aws_secret_access_key=provider["application_key"],
        config=Config(signature_version="s3v4"),
    )


def configure_bucket_cors(s3_client, bucket_name: str):
    cors_configuration = {
        'CORSRules': [{
            'AllowedHeaders': ['*'],
            'AllowedMethods': ['GET', 'HEAD', 'OPTIONS'],
            'AllowedOrigins': ['*'],
            'ExposeHeaders': ['*'],
            'MaxAgeSeconds': 3600
        }]
    }
    with console.status(f"[cyan]Configuring CORS for bucket {bucket_name}...", spinner="dots"):
        try:
            s3_client.put_bucket_cors(Bucket=bucket_name, CORSConfiguration=cors_configuration)
            console.print(f"[green]✓ Configured CORS for bucket {bucket_name}[/]")
        except Exception as e:
            console.print(f"[yellow]Warning: Could not configure CORS automatically. You may need to set it manually in B2 dashboard.[/] ({e})")


# ── Video processing ───────────────────────────────────────────────────────────

def run_command(cmd: list[str]) -> str:
    result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if result.returncode != 0:
        console.print(f"[red bold]Command failed:[/]\n{result.stderr}")
        sys.exit(1)
    return result.stdout


def probe_video(file_path: Path) -> dict:
    cmd = [
        "ffprobe",
        "-v", "quiet",
        "-print_format", "json",
        "-show_format",
        "-show_streams",
        str(file_path),
    ]
    output = run_command(cmd)
    return json.loads(output)


def process_video(input_path: Path, output_dir: Path, movie_slug: str) -> dict:
    output_dir.mkdir(parents=True, exist_ok=True)

    hls_key_hex = secrets.token_hex(16)
    hls_iv_hex = secrets.token_hex(16)

    key_info_path = output_dir / "key_info.txt"
    key_file_path = output_dir / "enc.key"
    key_url = "watchparty://key"

    with open(key_file_path, "wb") as f:
        f.write(bytes.fromhex(hls_key_hex))

    with open(key_info_path, "w") as f:
        f.write(f"{key_url}\n{key_file_path.absolute()}\n{hls_iv_hex}\n")

    master_playlist = output_dir / "master.m3u8"

    cmd = [
        "ffmpeg",
        "-y",
        "-i", str(input_path),
        "-c:v", "libx264",
        "-preset", "veryfast",
        "-crf", "23",
        "-c:a", "aac",
        "-b:a", "128k",
        "-hls_time", "6",
        "-hls_playlist_type", "vod",
        "-hls_key_info_file", str(key_info_path),
        "-hls_segment_filename", str(output_dir / "seg_%03d.ts"),
        str(master_playlist),
    ]
    
    with console.status("[magenta]Transcoding to HLS (this might take a while)...[/]", spinner="bouncingBar"):
        run_command(cmd)

    with console.status("[magenta]Generating poster and backdrop...[/]", spinner="bouncingBar"):
        poster_path = output_dir / "poster.jpg"
        run_command([
            "ffmpeg", "-y", "-ss", "00:00:05", "-i", str(input_path),
            "-vframes", "1", "-q:v", "2", str(poster_path),
        ])

        backdrop_path = output_dir / "backdrop.jpg"
        run_command([
            "ffmpeg", "-y", "-ss", "00:00:10", "-i", str(input_path),
            "-vframes", "1", "-q:v", "2", str(backdrop_path),
        ])

    return {
        "hls_key_hex": hls_key_hex,
        "hls_iv_hex": hls_iv_hex,
        "master_playlist": master_playlist,
        "poster_path": poster_path,
        "backdrop_path": backdrop_path,
    }


def upload_to_b2_with_progress(file_path: Path, s3_key: str, s3_client, bucket_name: str, progress: Progress) -> None:
    file_size = file_path.stat().st_size
    task_id = progress.add_task(f"[cyan]Uploading {file_path.name}", total=file_size)
    
    class ProgressCallback:
        def __init__(self):
            self.uploaded = 0
            
        def __call__(self, bytes_amount):
            self.uploaded += bytes_amount
            progress.update(task_id, advance=bytes_amount)
            
    s3_client.upload_file(str(file_path), bucket_name, s3_key, Callback=ProgressCallback())
    progress.remove_task(task_id)


# ── Main ───────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Upload and process a video for Watch Party.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="Example:\n  python process.py /path/to/Inception.mkv",
    )
    parser.add_argument("input_file", type=str, help="Path to the video file to upload")
    parser.add_argument(
        "--api-url",
        default="http://localhost:8000",
        metavar="URL",
        help="Watch Party backend URL (default: http://localhost:8000)",
    )
    args = parser.parse_args()
    api_url = args.api_url.rstrip("/")

    console.print(f"\n[bold magenta]Watch Party Video Uploader[/]")
    console.print(f"Target Backend: [underline]{api_url}[/]")

    input_path = Path(args.input_file).resolve()
    if not input_path.exists():
        console.print(f"[red bold]Error:[/] Input file not found: {input_path}")
        sys.exit(1)

    # ── Step 1: Initialize Supabase & Auth ──────────────────────────────────────
    supabase = init_supabase()
    access_token = prompt_auth(supabase)
    headers = {"Authorization": f"Bearer {access_token}"}

    # ── Step 2: Verify role ───────────────────────────────────────────────────
    verify_role(api_url, headers)

    # ── Step 3: Fetch storage provider + decrypted credentials ───────────────
    provider = fetch_storage_provider(api_url, headers)
    s3_client = build_s3_client(provider)
    
    # ── Step 3.5: Ensure CORS is configured ──────────────────────────────────
    configure_bucket_cors(s3_client, provider["bucket_name"])

    # ── Step 4: Pick collection and create movie record ───────────────────────
    collection_id = fetch_collection(api_url, headers)

    default_title = input_path.stem.replace(".", " ").replace("_", " ").replace("-", " ").title()
    title = Prompt.ask(f"Movie title", default=default_title)

    movie_id = create_movie_record(api_url, headers, title, collection_id, provider["id"])
    console.print()

    # ── Step 5: Probe input video ─────────────────────────────────────────────
    with console.status(f"[cyan]Probing {input_path.name}...", spinner="dots"):
        probe = probe_video(input_path)

    video_stream = next((s for s in probe.get("streams", []) if s.get("codec_type") == "video"), {})
    fmt = probe.get("format", {})
    duration_seconds = float(fmt.get("duration", 0))
    codec = video_stream.get("codec_name")
    resolution_width = video_stream.get("width")
    resolution_height = video_stream.get("height")
    file_size_bytes = int(fmt.get("size", 0)) or None

    movie_slug = movie_id
    output_dir = Path(tempfile.mkdtemp(prefix=f"watchparty_{movie_slug}_"))

    # ── Step 6: Transcode + generate images ──────────────────────────────────
    result = process_video(input_path, output_dir, movie_slug)

    hls_key_hex = result["hls_key_hex"]
    hls_iv_hex = result["hls_iv_hex"]
    master_playlist: Path = result["master_playlist"]
    poster_path: Path = result["poster_path"]
    backdrop_path: Path = result["backdrop_path"]
    
    console.print("[green]✓ Transcoding and metadata generation complete.[/]\n")

    # ── Step 7: Upload all files to bucket ────────────────────────────────────
    bucket = provider["bucket_name"]
    base_key = f"movies/{movie_slug}"
    
    files_to_upload = sorted(output_dir.glob("*.m3u8")) + sorted(output_dir.glob("*.ts"))
    
    enc_key_file = output_dir / "enc.key"
    if enc_key_file.exists():
        files_to_upload.append(enc_key_file)
        
    files_to_upload.extend([poster_path, backdrop_path])
    
    total_files = len(files_to_upload)
    console.print(f"[bold cyan]Uploading {total_files} files to storage...[/]")
    
    # Progress UI for Upload
    upload_progress = Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        BarColumn(),
        DownloadColumn(),
        TransferSpeedColumn(),
        TimeRemainingColumn(),
        console=console
    )
    
    overall_task = upload_progress.add_task("[bold yellow]Overall Progress", total=total_files)

    with upload_progress:
        for i, file in enumerate(files_to_upload):
            # Determine S3 key based on file type
            if file.suffix in [".m3u8", ".ts"]:
                s3_key = f"{base_key}/hls/{file.name}"
            elif file.name == "enc.key":
                s3_key = f"{base_key}/enc.key"
            else:
                s3_key = f"{base_key}/{file.name}"
                
            upload_to_b2_with_progress(file, s3_key, s3_client, bucket, upload_progress)
            upload_progress.update(overall_task, advance=1)
            
    console.print("[green]✓ All files uploaded successfully.[/]")

    # ── Step 8: Notify API of completed upload ────────────────────────────────
    with console.status("[cyan]Notifying API of completed upload...", spinner="dots"):
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
        if codec: patch_payload["codec"] = codec
        if resolution_width: patch_payload["resolution_width"] = resolution_width
        if resolution_height: patch_payload["resolution_height"] = resolution_height
        if file_size_bytes: patch_payload["file_size_bytes"] = file_size_bytes

        patch_resp = httpx.patch(
            f"{api_url}/api/movies/{movie_id}/upload-complete",
            json=patch_payload,
            headers=headers,
            timeout=30.0,
        )
        if patch_resp.status_code != 200:
            console.print(f"[red bold]Failed to update movie record:[/] {patch_resp.text}")
            sys.exit(1)

        updated_movie = patch_resp.json()
        
    console.print(f"\n[bold green]✨ Upload complete![/] Movie [italic]'{updated_movie.get('title', movie_id)}'[/] is now processed and available.")

    # Clean up temp directory
    shutil.rmtree(output_dir, ignore_errors=True)


if __name__ == "__main__":
    main()
