#!/usr/bin/env python3
"""
Watch Party — Video Uploader
=============================
Usage:
    python process.py /path/to/movie.mkv

That's it! The script will ask for your username and password,
then guide you through picking a collection and confirming the title.
No UUIDs, no config files, no technical knowledge needed.

To connect to a remote server:
    python process.py --api-url https://myserver.com /path/to/movie.mkv

Requirements: ffmpeg, ffprobe + Python packages in requirements.txt
"""

import getpass
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


# ── Auth helpers ───────────────────────────────────────────────────────────────

def prompt_auth(api_url: str) -> str:
    """Prompt for username and password, return a valid JWT access token.

    Args:
        api_url: Base URL of the Watch Party backend (no trailing slash).

    Returns:
        access_token — a valid JWT for the authenticated user.
    """
    print(f"Connecting to {api_url}")
    username = input("Username: ").strip()
    password = getpass.getpass("Password: ")

    print("Authenticating…")
    try:
        resp = httpx.post(
            f"{api_url}/api/auth/login",
            json={"username": username, "password": password},
            timeout=30.0,
        )
    except httpx.ConnectError as exc:
        print(f"[ERROR] Could not connect to {api_url}: {exc}")
        sys.exit(1)

    if resp.status_code != 200:
        try:
            detail = resp.json().get("detail", resp.text)
        except Exception:
            detail = resp.text
        print(f"[ERROR] Authentication failed ({resp.status_code}): {detail}")
        sys.exit(1)

    access_token = resp.json().get("access_token")
    if not access_token:
        print("[ERROR] No access_token in login response.")
        sys.exit(1)

    return access_token


def verify_role(api_url: str, headers: dict) -> None:
    """Verify the authenticated user has level2 or super_admin role.

    Exits with an error message if the role is insufficient.
    """
    resp = httpx.get(f"{api_url}/api/auth/me", headers=headers, timeout=30.0)
    if resp.status_code != 200:
        print(f"[ERROR] Could not verify user role ({resp.status_code}): {resp.text}")
        sys.exit(1)

    me = resp.json()
    role = me.get("role", "")
    if role not in ("level2", "super_admin"):
        print(
            f"[ERROR] Insufficient permissions. Your role is '{role}'. "
            "You need 'level2' or 'super_admin' to use the uploader."
        )
        sys.exit(1)

    print(f"Logged in as {me.get('username', me.get('email', 'unknown'))} (role: {role})")


def fetch_storage_provider(api_url: str, headers: dict) -> dict:
    """Fetch storage provider credentials from the API.

    If no providers exist, prints an error and exits.
    If multiple exist, prompts the user to choose one.

    Returns:
        A dict with keys: id, bucket_name, endpoint_url, key_id, application_key
    """
    resp = httpx.get(f"{api_url}/api/storage-providers", headers=headers, timeout=30.0)
    if resp.status_code != 200:
        print(f"[ERROR] Failed to list storage providers ({resp.status_code}): {resp.text}")
        sys.exit(1)

    providers = resp.json()
    if not providers:
        print(
            f"[ERROR] No storage bucket configured. "
            f"Please add one in your account settings at {api_url}/admin/settings/storage"
        )
        sys.exit(1)

    if len(providers) == 1:
        chosen = providers[0]
    else:
        print("\nAvailable storage providers:")
        for i, p in enumerate(providers, start=1):
            print(f"  {i}. {p['name']}  [{p['provider_type']}]  bucket: {p['bucket_name']}")
        while True:
            raw = input(f"Select a provider [1-{len(providers)}]: ").strip()
            if raw.isdigit() and 1 <= int(raw) <= len(providers):
                chosen = providers[int(raw) - 1]
                break
            print(f"  Please enter a number between 1 and {len(providers)}.")

    provider_id = chosen["id"]

    # Fetch decrypted credentials from the dedicated endpoint
    cred_resp = httpx.get(
        f"{api_url}/api/storage-providers/{provider_id}/credentials",
        headers=headers,
        timeout=30.0,
    )
    if cred_resp.status_code != 200:
        print(
            f"[ERROR] Could not retrieve credentials for provider '{chosen['name']}' "
            f"({cred_resp.status_code}): {cred_resp.text}"
        )
        sys.exit(1)

    creds = cred_resp.json()
    return {
        "id": provider_id,
        "name": chosen["name"],
        "bucket_name": creds["bucket_name"],
        "endpoint_url": creds["endpoint_url"],
        "key_id": creds["key_id"],
        "application_key": creds["application_key"],
    }


def fetch_collection(api_url: str, headers: dict) -> str:
    """List available collections and let the user pick one.

    Returns:
        collection_id (UUID string) of the chosen collection.
    """
    resp = httpx.get(f"{api_url}/api/collections", headers=headers, timeout=30.0)
    if resp.status_code != 200:
        print(f"[ERROR] Failed to list collections ({resp.status_code}): {resp.text}")
        sys.exit(1)

    collections = resp.json()
    if not collections:
        print(
            "[ERROR] No collections found. Please create a collection in the web UI first.\n"
            f"  → {api_url}/library"
        )
        sys.exit(1)

    if len(collections) == 1:
        chosen = collections[0]
        print(f"Adding to collection: {chosen['name']}")
        return chosen["id"]

    print("\nAvailable collections:")
    for i, c in enumerate(collections, start=1):
        print(f"  {i}. {c['name']}")
    while True:
        raw = input(f"Select a collection [1-{len(collections)}]: ").strip()
        if raw.isdigit() and 1 <= int(raw) <= len(collections):
            return collections[int(raw) - 1]["id"]
        print(f"  Please enter a number between 1 and {len(collections)}.")


def create_movie_record(api_url: str, headers: dict, title: str, collection_id: str) -> str:
    """Create an empty movie record via the API and return its UUID."""
    resp = httpx.post(
        f"{api_url}/api/movies",
        json={"title": title, "collection_id": collection_id},
        headers=headers,
        timeout=30.0,
    )
    if resp.status_code != 201:
        try:
            detail = resp.json().get("detail", resp.text)
        except Exception:
            detail = resp.text
        print(f"[ERROR] Failed to create movie record ({resp.status_code}): {detail}")
        sys.exit(1)

    movie_id = resp.json()["id"]
    print(f"Created movie record: {title} (id: {movie_id})")
    return movie_id


def build_s3_client(provider: dict):
    """Return a boto3 S3 client configured for the chosen storage provider."""
    return boto3.client(
        "s3",
        endpoint_url=provider["endpoint_url"],
        aws_access_key_id=provider["key_id"],
        aws_secret_access_key=provider["application_key"],
        config=Config(signature_version="s3v4"),
    )


# ── Video processing ───────────────────────────────────────────────────────────

def run_command(cmd: list[str]) -> str:
    print(f"Running: {' '.join(cmd)}")
    result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if result.returncode != 0:
        print(f"Command failed:\n{result.stderr}")
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

    print("Transcoding to HLS (this might take a while)…")
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
    run_command(cmd)

    print("Generating poster and backdrop…")
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


def upload_to_b2(file_path: Path, s3_key: str, s3_client, bucket_name: str) -> None:
    print(f"Uploading {file_path.name} → {s3_key}")
    s3_client.upload_file(str(file_path), bucket_name, s3_key)


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

    input_path = Path(args.input_file).resolve()
    if not input_path.exists():
        print(f"[ERROR] Input file not found: {input_path}")
        sys.exit(1)

    # ── Step 1: Interactive authentication (username + password only) ──────────
    access_token = prompt_auth(api_url)
    headers = {"Authorization": f"Bearer {access_token}"}

    # ── Step 2: Verify role ───────────────────────────────────────────────────
    verify_role(api_url, headers)

    # ── Step 3: Fetch storage provider + decrypted credentials ───────────────
    provider = fetch_storage_provider(api_url, headers)
    print(f"\nUsing storage provider: {provider['name']}  (bucket: {provider['bucket_name']})")

    s3_client = build_s3_client(provider)

    # ── Step 4: Pick collection and create movie record ───────────────────────
    print("")
    collection_id = fetch_collection(api_url, headers)

    # Default title = filename without extension, prettified
    default_title = input_path.stem.replace(".", " ").replace("_", " ").replace("-", " ").title()
    title_input = input(f"Movie title [{default_title}]: ").strip()
    title = title_input if title_input else default_title

    movie_id = create_movie_record(api_url, headers, title, collection_id)
    print("")

    # ── Step 5: Probe input video ─────────────────────────────────────────────
    print(f"Probing: {input_path}")
    probe = probe_video(input_path)

    # Extract useful metadata from ffprobe output
    video_stream = next(
        (s for s in probe.get("streams", []) if s.get("codec_type") == "video"),
        {},
    )
    fmt = probe.get("format", {})
    duration_seconds = float(fmt.get("duration", 0))
    codec = video_stream.get("codec_name")
    resolution_width = video_stream.get("width")
    resolution_height = video_stream.get("height")
    file_size_bytes = int(fmt.get("size", 0)) or None

    movie_slug = movie_id  # used as folder prefix in the bucket
    output_dir = Path(tempfile.mkdtemp(prefix=f"watchparty_{movie_slug}_"))

    # ── Step 5: Transcode + generate images ──────────────────────────────────
    result = process_video(input_path, output_dir, movie_slug)

    hls_key_hex = result["hls_key_hex"]
    hls_iv_hex = result["hls_iv_hex"]
    master_playlist: Path = result["master_playlist"]
    poster_path: Path = result["poster_path"]
    backdrop_path: Path = result["backdrop_path"]

    # ── Step 6: Upload all files to bucket ────────────────────────────────────
    bucket = provider["bucket_name"]
    base_key = f"movies/{movie_slug}"

    # Upload all HLS segments and playlists
    for file in sorted(output_dir.glob("*.m3u8")) + sorted(output_dir.glob("*.ts")):
        upload_to_b2(file, f"{base_key}/hls/{file.name}", s3_client, bucket)

    # Upload the encryption key (served by the API, not from the bucket directly,
    # but we store it so the backend can retrieve it if needed)
    enc_key_file = output_dir / "enc.key"
    if enc_key_file.exists():
        upload_to_b2(enc_key_file, f"{base_key}/enc.key", s3_client, bucket)

    # Upload images
    hls_master_s3_key = f"{base_key}/master.m3u8"
    poster_s3_key = f"{base_key}/poster.jpg"
    backdrop_s3_key = f"{base_key}/backdrop.jpg"

    upload_to_b2(poster_path, poster_s3_key, s3_client, bucket)
    upload_to_b2(backdrop_path, backdrop_s3_key, s3_client, bucket)

    # ── Step 7: Notify API of completed upload ────────────────────────────────
    print("\nNotifying API of completed upload…")
    patch_payload = {
        "duration_seconds": duration_seconds,
        "hls_master_path": hls_master_s3_key,
        "poster_path": poster_s3_key,
        "backdrop_path": backdrop_s3_key,
        "hls_key_hex": hls_key_hex,
        "hls_iv_hex": hls_iv_hex,
        "is_processed": True,
        "is_uploaded": True,
    }
    if codec:
        patch_payload["codec"] = codec
    if resolution_width:
        patch_payload["resolution_width"] = resolution_width
    if resolution_height:
        patch_payload["resolution_height"] = resolution_height
    if file_size_bytes:
        patch_payload["file_size_bytes"] = file_size_bytes

    patch_resp = httpx.patch(
        f"{api_url}/api/movies/{movie_id}/upload-complete",
        json=patch_payload,
        headers=headers,
        timeout=30.0,
    )
    if patch_resp.status_code != 200:
        print(
            f"[ERROR] Failed to update movie record ({patch_resp.status_code}): "
            f"{patch_resp.text}"
        )
        sys.exit(1)

    updated_movie = patch_resp.json()
    print(
        f"\n✓ Upload complete! Movie '{updated_movie.get('title', movie_id)}' "
        f"is now processed and available."
    )

    # Clean up temp directory
    shutil.rmtree(output_dir, ignore_errors=True)


if __name__ == "__main__":
    main()
