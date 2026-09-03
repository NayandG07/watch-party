#!/usr/bin/env python3
"""
Recovery script to finalize an uploaded movie that failed due to timeout or token expiration.

Usage:
    python finalize_upload.py <movie_id>

This script will:
1. Wake up the Render backend if it is asleep
2. Authenticate you with Supabase
3. Auto-detect HLS encryption keys and metadata from local temp directory (if present)
4. Call the /upload-complete endpoint to finalize the movie record
5. Clean up temporary files upon success
"""

import argparse
import glob
import os
import shutil
import sys
import tempfile
import time
from pathlib import Path

import httpx
from dotenv import load_dotenv
from rich.console import Console
from rich.prompt import Prompt
from supabase import create_client, Client

console = Console()


def init_supabase() -> Client:
    env_path = Path(__file__).parent / ".env"
    load_dotenv(dotenv_path=env_path)
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_ANON_KEY")
    if not url or not key:
        console.print("[red bold]Error:[/] SUPABASE_URL or SUPABASE_ANON_KEY not found in .env file.")
        sys.exit(1)
    return create_client(url, key)


def wake_backend(api_url: str) -> None:
    """Ping health endpoint to wake up sleeping Render backend if needed."""
    with console.status("[cyan]Checking backend health & waking server if asleep...", spinner="dots"):
        for attempt in range(1, 4):
            try:
                resp = httpx.get(f"{api_url}/api/health", timeout=90.0)
                if resp.status_code == 200:
                    console.print("[green]✓ Backend is awake and responsive[/]")
                    return
            except httpx.TimeoutException:
                console.print(f"[yellow]Server wake-up attempt {attempt}/3 timed out. Retrying...[/]")
            except Exception as e:
                console.print(f"[yellow]Attempt {attempt}/3 error: {e}. Retrying...[/]")
            time.sleep(3)
    console.print("[yellow]Warning: Backend did not respond to health check. Proceeding anyway...[/]")


def authenticate(supabase: Client) -> str:
    console.print("\n[bold cyan]Authentication[/]")
    email = Prompt.ask("Email")
    password = Prompt.ask("Password", password=True)
    with console.status("[cyan]Authenticating...", spinner="dots"):
        try:
            response = supabase.auth.sign_in_with_password({"email": email, "password": password})
            access_token = response.session.access_token
        except Exception as e:
            console.print(f"[red bold]Authentication failed:[/] {e}")
            sys.exit(1)
    if not access_token:
        console.print("[red bold]Error:[/] No access_token in login response.")
        sys.exit(1)
    console.print("[green]✓ Authenticated successfully[/]")
    return access_token


def get_movie_info(api_url: str, headers: dict, movie_id: str) -> dict:
    """Fetch current movie info from API with retry."""
    with console.status("[cyan]Fetching movie info...", spinner="dots"):
        for attempt in range(1, 4):
            try:
                resp = httpx.get(f"{api_url}/api/movies/{movie_id}", headers=headers, timeout=120.0)
                resp.raise_for_status()
                return resp.json()
            except httpx.TimeoutException:
                if attempt < 3:
                    time.sleep(3)
                    continue
                console.print("[red bold]Failed to fetch movie info: Request timed out.[/]")
                sys.exit(1)
            except Exception as e:
                console.print(f"[red bold]Failed to fetch movie info:[/] {e}")
                sys.exit(1)


def finalize_movie(api_url: str, headers: dict, movie_id: str, payload: dict) -> dict:
    """Call the upload-complete endpoint with retry on cold-start timeout."""
    with console.status("[cyan]Finalizing movie (updating database)...", spinner="dots"):
        for attempt in range(1, 4):
            try:
                resp = httpx.patch(
                    f"{api_url}/api/movies/{movie_id}/upload-complete",
                    json=payload,
                    headers=headers,
                    timeout=120.0,
                )
                if resp.status_code != 200:
                    console.print(f"[red bold]Failed to finalize movie:[/] {resp.text}")
                    sys.exit(1)
                return resp.json()
            except httpx.TimeoutException:
                console.print(f"[yellow]Finalize request timed out (attempt {attempt}/3). Retrying in 5s...[/]")
                time.sleep(5)
            except Exception as e:
                console.print(f"[red bold]Error finalizing movie:[/] {e}")
                sys.exit(1)
    console.print("[red bold]Failed to finalize movie after 3 attempts due to timeout.[/]")
    sys.exit(1)


def main():
    parser = argparse.ArgumentParser(
        description="Finalize an uploaded movie that failed due to timeout or token expiration",
    )
    parser.add_argument("movie_id", type=str, help="Movie ID (UUID)")
    parser.add_argument("--api-url", default="https://watch-party-u7jq.onrender.com", metavar="URL")
    parser.add_argument("--duration", type=float, help="Duration in seconds (e.g., 9530.56)")
    parser.add_argument("--width", type=int, help="Resolution width (e.g., 1920)")
    parser.add_argument("--height", type=int, help="Resolution height (e.g., 800)")
    parser.add_argument("--codec", type=str, help="Video codec (e.g., hevc)")
    parser.add_argument("--file-size", type=int, help="Original file size in bytes")
    parser.add_argument("--key", type=str, help="HLS encryption key (hex string)")
    parser.add_argument("--iv", type=str, help="HLS encryption IV (hex string)")
    parser.add_argument("--clean", action="store_true", help="Auto clean temp folder on success")
    args = parser.parse_args()

    api_url = args.api_url.rstrip("/")
    movie_id = args.movie_id

    console.print(f"\n[bold magenta]Watch Party — Movie Finalizer[/]")
    console.print(f"Backend: [underline]{api_url}[/]")
    console.print(f"Movie ID: [bold]{movie_id}[/]\n")

    # 1. Wake backend
    wake_backend(api_url)

    # 2. Authenticate
    supabase = init_supabase()
    access_token = authenticate(supabase)
    headers = {"Authorization": f"Bearer {access_token}"}

    # 3. Check for local temp folder to auto-detect key, iv, etc.
    detected_temp_dir = None
    temp_pattern = os.path.join(tempfile.gettempdir(), f"watchparty_{movie_id}_*")
    matches = glob.glob(temp_pattern)
    if matches:
        detected_temp_dir = Path(matches[0])
        console.print(f"\n[green]✓ Found local temp files:[/] {detected_temp_dir}")
        enc_key_file = detected_temp_dir / "enc.key"
        if enc_key_file.exists() and not args.key:
            args.key = enc_key_file.read_bytes().hex()
            console.print(f"  Auto-detected HLS key: [cyan]{args.key}[/]")

        key_info_file = detected_temp_dir / "key_info.txt"
        if key_info_file.exists() and not args.iv:
            lines = [line.strip() for line in key_info_file.read_text().splitlines() if line.strip()]
            if len(lines) >= 3:
                args.iv = lines[2]
                console.print(f"  Auto-detected HLS IV:  [cyan]{args.iv}[/]")

    # 4. Fetch current movie info
    movie_info = get_movie_info(api_url, headers, movie_id)
    console.print(f"\n[bold]Current movie info:[/]")
    console.print(f"  Title: [cyan]{movie_info.get('title')}[/]")
    console.print(f"  Processed: [cyan]{movie_info.get('is_processed')}[/]")
    console.print(f"  Uploaded: [cyan]{movie_info.get('is_uploaded')}[/]")

    # 5. Build the finalization payload
    base_key = f"movies/{movie_id}"
    payload = {
        "hls_master_path": f"{base_key}/hls/master.m3u8",
        "poster_path": f"{base_key}/poster.jpg",
        "backdrop_path": f"{base_key}/backdrop.jpg",
        "is_processed": True,
        "is_uploaded": True,
    }

    if args.duration:
        payload["duration_seconds"] = args.duration
    elif movie_info.get("duration_seconds"):
        payload["duration_seconds"] = movie_info.get("duration_seconds")
    else:
        duration_str = Prompt.ask("Duration in seconds (e.g., 9530.56)", default="")
        if duration_str:
            payload["duration_seconds"] = float(duration_str)

    if args.width:
        payload["resolution_width"] = args.width
    elif movie_info.get("resolution_width"):
        payload["resolution_width"] = movie_info.get("resolution_width")

    if args.height:
        payload["resolution_height"] = args.height
    elif movie_info.get("resolution_height"):
        payload["resolution_height"] = movie_info.get("resolution_height")

    if args.codec:
        payload["codec"] = args.codec
    elif movie_info.get("codec"):
        payload["codec"] = movie_info.get("codec")
    else:
        codec = Prompt.ask("Video codec (e.g., hevc)", default="")
        if codec:
            payload["codec"] = codec

    if args.file_size:
        payload["file_size_bytes"] = args.file_size
    elif movie_info.get("file_size_bytes"):
        payload["file_size_bytes"] = movie_info.get("file_size_bytes")

    if args.key:
        payload["hls_key_hex"] = args.key
    elif movie_info.get("hls_key_hex"):
        payload["hls_key_hex"] = movie_info.get("hls_key_hex")
    else:
        key = Prompt.ask("HLS encryption key (32-char hex)", default="")
        if key:
            payload["hls_key_hex"] = key

    if args.iv:
        payload["hls_iv_hex"] = args.iv
    elif movie_info.get("hls_iv_hex"):
        payload["hls_iv_hex"] = movie_info.get("hls_iv_hex")
    else:
        iv = Prompt.ask("HLS encryption IV (32-char hex)", default="")
        if iv:
            payload["hls_iv_hex"] = iv

    console.print("\n[bold]Payload to send:[/]")
    for key, value in payload.items():
        console.print(f"  {key}: [cyan]{value}[/]")

    confirm = Prompt.ask("\n[yellow]Proceed with finalization?[/]", choices=["y", "n"], default="y")
    if confirm != "y":
        console.print("[yellow]Aborted.[/]")
        sys.exit(0)

    # 6. Finalize movie
    result = finalize_movie(api_url, headers, movie_id, payload)

    console.print(f"\n[bold green]✨ Success![/] Movie '[italic]{result.get('title')}[/]' has been finalized.")
    console.print(f"  Duration: [cyan]{result.get('duration_seconds')}s[/]")
    console.print(f"  Resolution: [cyan]{result.get('resolution_width')}x{result.get('resolution_height')}[/]")
    console.print(f"  Processed: [cyan]{result.get('is_processed')}[/]")
    console.print(f"  Uploaded: [cyan]{result.get('is_uploaded')}[/]")

    # 7. Clean up temp folder if detected
    if detected_temp_dir and detected_temp_dir.exists():
        do_clean = args.clean
        if not do_clean:
            do_clean = Prompt.ask(
                f"\n[yellow]Clean up temporary files at {detected_temp_dir}?[/]",
                choices=["y", "n"],
                default="y",
            ) == "y"
        if do_clean:
            shutil.rmtree(detected_temp_dir, ignore_errors=True)
            console.print("[green]✓ Temporary files deleted.[/]")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        console.print("\n[yellow]Aborted.[/]")
        sys.exit(0)
