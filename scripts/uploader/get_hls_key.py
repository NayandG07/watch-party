#!/usr/bin/env python3
"""
Fetch the HLS encryption key from an uploaded movie in B2 storage.

Usage:
    python get_hls_key.py <movie_id>
"""

import argparse
import os
import sys
from pathlib import Path

import boto3
import httpx
from botocore.client import Config
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
    console.print("[green]✓ Authenticated successfully[/]")
    return access_token


def get_storage_provider(api_url: str, headers: dict, storage_provider_id: str) -> dict:
    """Fetch storage provider credentials"""
    with console.status("[cyan]Fetching storage credentials...", spinner="dots"):
        try:
            resp = httpx.get(
                f"{api_url}/api/storage-providers/{storage_provider_id}/credentials",
                headers=headers,
                timeout=30.0
            )
            resp.raise_for_status()
            creds = resp.json()
            
            endpoint_url = creds.get("endpoint_url", "")
            if endpoint_url and not endpoint_url.startswith("http"):
                endpoint_url = f"https://{endpoint_url}"
            
            return {
                "bucket_name": creds["bucket_name"],
                "endpoint_url": endpoint_url,
                "key_id": creds["key_id"],
                "application_key": creds["application_key"],
            }
        except Exception as e:
            console.print(f"[red bold]Failed to fetch storage credentials:[/] {e}")
            sys.exit(1)


def get_movie_info(api_url: str, headers: dict, movie_id: str) -> dict:
    """Fetch movie info to get storage provider ID"""
    with console.status("[cyan]Fetching movie info...", spinner="dots"):
        try:
            resp = httpx.get(f"{api_url}/api/movies/{movie_id}", headers=headers, timeout=30.0)
            resp.raise_for_status()
            return resp.json()
        except Exception as e:
            console.print(f"[red bold]Failed to fetch movie info:[/] {e}")
            sys.exit(1)


def download_key_from_b2(provider: dict, movie_id: str) -> bytes:
    """Download enc.key file from B2"""
    s3_client = boto3.client(
        "s3",
        endpoint_url=provider["endpoint_url"],
        aws_access_key_id=provider["key_id"],
        aws_secret_access_key=provider["application_key"],
        config=Config(signature_version="s3v4"),
    )
    
    key_path = f"movies/{movie_id}/enc.key"
    
    with console.status(f"[cyan]Downloading {key_path}...", spinner="dots"):
        try:
            response = s3_client.get_object(Bucket=provider["bucket_name"], Key=key_path)
            key_bytes = response['Body'].read()
            console.print(f"[green]✓ Downloaded enc.key ({len(key_bytes)} bytes)[/]")
            return key_bytes
        except Exception as e:
            console.print(f"[red bold]Failed to download key:[/] {e}")
            sys.exit(1)


def main():
    parser = argparse.ArgumentParser(
        description="Fetch HLS encryption key from uploaded movie",
    )
    parser.add_argument("movie_id", type=str, help="Movie ID (UUID)")
    parser.add_argument("--api-url", default="https://watch-party-u7jq.onrender.com", metavar="URL")
    args = parser.parse_args()

    api_url = args.api_url.rstrip("/")
    movie_id = args.movie_id

    console.print(f"\n[bold magenta]Watch Party — HLS Key Retriever[/]")
    console.print(f"Movie ID: [bold]{movie_id}[/]\n")

    # Authenticate
    supabase = init_supabase()
    access_token = authenticate(supabase)
    headers = {"Authorization": f"Bearer {access_token}"}

    # Get movie info to find storage provider
    movie_info = get_movie_info(api_url, headers, movie_id)
    storage_provider_id = movie_info.get("storage_provider_id")
    
    if not storage_provider_id:
        console.print("[red bold]Error:[/] Movie has no storage provider ID")
        sys.exit(1)

    # Get storage credentials
    provider = get_storage_provider(api_url, headers, storage_provider_id)

    # Download the key file
    key_bytes = download_key_from_b2(provider, movie_id)

    # Convert to hex
    hls_key_hex = key_bytes.hex()
    
    console.print(f"\n[bold green]✓ HLS Encryption Key Found![/]\n")
    console.print(f"[bold]HLS Key (hex):[/] [cyan]{hls_key_hex}[/]")
    console.print(f"\n[yellow]Note:[/] The IV was generated randomly during encoding.")
    console.print(f"If you need the IV, check the variant playlist files (playlist.m3u8) in the HLS output.")
    console.print(f"\n[bold]To finalize the movie, run:[/]")
    console.print(f'[cyan]python finalize_upload.py {movie_id} --duration 7974 --width 1920 --height 1036 --codec hevc --key {hls_key_hex} --iv <IV_HEX>[/]')


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        console.print("\n[yellow]Aborted.[/]")
        sys.exit(0)
