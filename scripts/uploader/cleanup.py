#!/usr/bin/env python3
"""
Watch Party - Movie Cleanup Tool
==================================
Finds and removes orphaned movie records that were created (e.g. by
a failed uploader run) but never successfully processed or uploaded.

What it does:
  1. Authenticates with Supabase
  2. Lists all movies that are not fully processed/uploaded
  3. Lets you review and choose which ones to delete
  4. Deletes the chosen records from the database via the API
  5. Optionally also deletes the associated files from your B2 bucket

Usage:
    python cleanup.py

To automatically delete B2 files without prompting:
    python cleanup.py --delete-b2

To connect to a remote server:
    python cleanup.py --api-url https://myserver.com

Requirements: httpx, boto3, supabase, rich, python-dotenv
"""

import argparse
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

import boto3
import httpx
from botocore.client import Config
from dotenv import load_dotenv
from supabase import create_client, Client

from rich.console import Console
from rich.prompt import Prompt, Confirm
from rich.table import Table

console = Console()

# Helpers

def format_age(iso_timestamp: str) -> str:
    try:
        created = datetime.fromisoformat(iso_timestamp.replace("Z", "+00:00"))
        delta = datetime.now(timezone.utc) - created
        if delta.days > 0:
            return f"{delta.days}d ago"
        hours = delta.seconds // 3600
        minutes = (delta.seconds % 3600) // 60
        if hours > 0:
            return f"{hours}h {minutes}m ago"
        return f"{minutes}m ago"
    except Exception:
        return iso_timestamp[:19]


# Auth

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


def authenticate(api_url: str, supabase: Client) -> tuple[str, dict]:
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
        console.print("[red bold]Error:[/] No access_token in response.")
        sys.exit(1)

    headers = {"Authorization": f"Bearer {access_token}"}
    
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
        console.print(f"[red bold]Insufficient permissions.[/] Your role is '{role}'.")
        sys.exit(1)

    console.print(f"[green]✓ Logged in as[/] [bold]{me.get('username', me.get('email', 'unknown'))}[/] (role: [italic]{role}[/])\n")
    return access_token, headers


# Fetch

def fetch_orphaned_movies(api_url: str, headers: dict) -> list[dict]:
    with console.status("[cyan]Scanning for orphaned movie records...", spinner="dots"):
        resp = httpx.get(f"{api_url}/api/movies", headers=headers, timeout=30.0)
        if resp.status_code != 200:
            console.print(f"[red bold]Failed to list movies:[/] {resp.status_code} {resp.text}")
            sys.exit(1)
    return [m for m in resp.json() if not m.get("is_processed") or not m.get("is_uploaded")]


# B2

def fetch_storage_credentials(api_url: str, headers: dict) -> dict | None:
    with console.status("[cyan]Fetching storage providers...", spinner="dots"):
        resp = httpx.get(f"{api_url}/api/storage-providers", headers=headers, timeout=30.0)
    
    if resp.status_code != 200 or not resp.json():
        return None
    
    providers = resp.json()
    if len(providers) == 1:
        provider_id = providers[0]["id"]
    else:
        console.print("\n[bold]Multiple storage providers found:[/]")
        for i, p in enumerate(providers, 1):
            console.print(f"  [cyan]{i}.[/] {p['name']} (bucket: {p['bucket_name']})")
            
        choice_str = Prompt.ask(f"Select provider for B2 cleanup", default="1")
        if not choice_str.isdigit() or not (1 <= int(choice_str) <= len(providers)):
            return None
        provider_id = providers[int(choice_str) - 1]["id"]

    with console.status("[cyan]Fetching B2 credentials...", spinner="dots"):
        cred_resp = httpx.get(
            f"{api_url}/api/storage-providers/{provider_id}/credentials",
            headers=headers,
            timeout=30.0,
        )
    if cred_resp.status_code != 200:
        return None
        
    creds = cred_resp.json()
    endpoint_url = creds.get("endpoint_url", "")
    if endpoint_url and not endpoint_url.startswith("http"):
        endpoint_url = f"https://{endpoint_url}"

    return {
        "bucket_name": creds["bucket_name"],
        "endpoint_url": endpoint_url,
        "key_id": creds["key_id"],
        "application_key": creds["application_key"],
    }


def delete_b2_folder(movie_id: str, creds: dict) -> None:
    s3 = boto3.client(
        "s3",
        endpoint_url=creds["endpoint_url"],
        aws_access_key_id=creds["key_id"],
        aws_secret_access_key=creds["application_key"],
        config=Config(signature_version="s3v4"),
    )
    bucket = creds["bucket_name"]
    prefix = f"movies/{movie_id}/"

    console.print(f"    [cyan]Scanning B2 for:[/] {prefix}")
    try:
        paginator = s3.get_paginator("list_objects_v2")
        objects_to_delete = []
        for page in paginator.paginate(Bucket=bucket, Prefix=prefix):
            for obj in page.get("Contents", []):
                objects_to_delete.append({"Key": obj["Key"]})

        if not objects_to_delete:
            console.print("    [yellow]No B2 files found for this movie.[/]")
            return

        s3.delete_objects(
            Bucket=bucket,
            Delete={"Objects": objects_to_delete, "Quiet": True},
        )
        console.print(f"    [green]Deleted {len(objects_to_delete)} file(s) from B2.[/]")
    except Exception as exc:
        console.print(f"    [red]Failed to connect or delete from B2:[/] {exc}")
        console.print("    [yellow]Skipping B2 deletion for this movie. You may need to clean it up manually.[/]")


# Delete

def delete_movie_record(api_url: str, headers: dict, movie: dict, b2_creds: dict | None) -> None:
    movie_id = movie["id"]
    title = movie["title"]
    resp = httpx.delete(f"{api_url}/api/movies/{movie_id}", headers=headers, timeout=30.0)
    
    if resp.status_code == 204:
        console.print(f"  [green][DB][/]  Deleted: \"[bold]{title}[/]\"")
    else:
        console.print(f"  [red][DB][/]  FAILED to delete \"[bold]{title}[/]\": {resp.status_code} {resp.text}")
        return

    if b2_creds:
        delete_b2_folder(movie_id, b2_creds)
    else:
        console.print(f"  [yellow][B2][/]  Skipped. Clean up manually: movies/{movie_id}/")


# Main

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Watch Party - Clean up orphaned (failed/incomplete) movie uploads.",
    )
    parser.add_argument("--api-url", default="http://localhost:8000", metavar="URL")
    parser.add_argument("--delete-b2", action="store_true", help="Auto-delete B2 files without prompting")
    args = parser.parse_args()
    api_url = args.api_url.rstrip("/")

    console.print()
    console.print("[bold magenta]============================================================[/]")
    console.print("[bold magenta]  Watch Party - Movie Cleanup Tool[/]")
    console.print("[bold magenta]============================================================[/]")
    console.print()

    supabase = init_supabase()
    token, headers = authenticate(api_url, supabase)

    orphans = fetch_orphaned_movies(api_url, headers)

    if not orphans:
        console.print("[green]No orphaned movies found. Everything looks clean![/]")
        return

    console.print(f"\n[bold]Found {len(orphans)} orphaned movie(s):[/]\n")
    
    table = Table(show_header=True, header_style="bold cyan")
    table.add_column("#", style="dim", width=4)
    table.add_column("Title")
    table.add_column("Status", style="yellow")
    table.add_column("Age", justify="right")

    for i, m in enumerate(orphans, 1):
        parts = []
        if not m.get("is_processed"):
            parts.append("not processed")
        if not m.get("is_uploaded"):
            parts.append("not uploaded")
        status = ", ".join(parts) or "incomplete"
        age = format_age(m.get("created_at", ""))
        
        t = m["title"][:33] + ".." if len(m["title"]) > 35 else m["title"]
        table.add_row(str(i), t, status, age)
        
    console.print(table)
    console.print()

    console.print("[bold]Which movies do you want to delete?[/]")
    console.print("Enter a number (e.g. '2'), comma-separated list (e.g. '1,3'), 'all', or 'q' to quit.")
    
    choice = Prompt.ask("\nChoice").strip().lower()

    if choice in ("q", ""):
        console.print("[yellow]Aborted. No changes made.[/]")
        return

    if choice == "all":
        to_delete = orphans
    else:
        indices = []
        for part in choice.split(","):
            part = part.strip()
            if part.isdigit() and 1 <= int(part) <= len(orphans):
                indices.append(int(part) - 1)
            else:
                console.print(f"[red bold]Invalid selection '{part}'. Aborted.[/]")
                return
        to_delete = [orphans[i] for i in indices]

    if not to_delete:
        console.print("[yellow]Nothing selected. Aborted.[/]")
        return

    # B2 cleanup
    b2_creds = None
    if args.delete_b2:
        clean_b2 = True
    else:
        clean_b2 = Confirm.ask("\nAlso delete associated files from Backblaze B2?")

    if clean_b2:
        b2_creds = fetch_storage_credentials(api_url, headers)
            
        if not b2_creds:
            console.print("[yellow]Could not fetch B2 credentials. Skipping B2 deletion.[/]")

    # Confirm
    console.print(f"\n[bold red]About to permanently delete {len(to_delete)} movie record(s):[/]")
    for m in to_delete:
        console.print(f"  - \"{m['title']}\" [dim]({m['id']})[/]")
        
    if b2_creds:
        console.print("  [red]+ Their B2 bucket files will also be removed.[/]")
    else:
        console.print("  [dim]+ B2 files will NOT be touched (delete manually if needed).[/]")

    if not Confirm.ask("\nAre you sure you want to proceed?"):
        console.print("[yellow]Aborted. No changes made.[/]")
        return

    console.print()
    for m in to_delete:
        console.print(f"Deleting \"[bold]{m['title']}[/]\"...")
        delete_movie_record(api_url, headers, m, b2_creds)

    console.print()
    console.print("[bold magenta]============================================================[/]")
    console.print(f"[bold green]  ✓ Done! Removed {len(to_delete)} orphaned record(s).[/]")
    if not b2_creds:
        console.print("  [yellow]Remember to manually clean up any B2 files if needed.[/]")
    console.print("[bold magenta]============================================================[/]")


if __name__ == "__main__":
    main()
