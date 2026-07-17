#!/usr/bin/env python3
"""
Watch Party - Movie Cleanup Tool
==================================
Finds and removes orphaned movie records that were created (e.g. by
a failed uploader run) but never successfully processed or uploaded.

What it does:
  1. Authenticates with the Watch Party API
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

Requirements: Same as process.py (httpx, boto3 in requirements.txt)
"""

import argparse
import getpass
import sys
from datetime import datetime, timezone

import boto3
import httpx
from botocore.client import Config


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

def authenticate(api_url: str) -> tuple[str, dict]:
    print(f"Connecting to {api_url}")
    username = input("Username: ").strip()
    password = getpass.getpass("Password: ")
    print("Authenticating...")

    try:
        resp = httpx.post(
            f"{api_url}/api/auth/login",
            json={"username": username, "password": password},
            timeout=30.0,
        )
    except httpx.ConnectError as exc:
        print(f"[ERROR] Cannot connect to {api_url}: {exc}")
        sys.exit(1)

    if resp.status_code != 200:
        try:
            detail = resp.json().get("detail", resp.text)
        except Exception:
            detail = resp.text
        print(f"[ERROR] Login failed ({resp.status_code}): {detail}")
        sys.exit(1)

    token = resp.json().get("access_token")
    if not token:
        print("[ERROR] No access_token in response.")
        sys.exit(1)

    headers = {"Authorization": f"Bearer {token}"}
    me = httpx.get(f"{api_url}/api/auth/me", headers=headers, timeout=30.0).json()
    role = me.get("role", "")
    if role not in ("level2", "super_admin"):
        print(f"[ERROR] Insufficient permissions. Your role is '{role}'.")
        sys.exit(1)

    print(f"Logged in as {me.get('username')} (role: {role})\n")
    return token, headers


# Fetch

def fetch_orphaned_movies(api_url: str, headers: dict) -> list[dict]:
    resp = httpx.get(f"{api_url}/api/movies", headers=headers, timeout=30.0)
    if resp.status_code != 200:
        print(f"[ERROR] Failed to list movies: {resp.status_code} {resp.text}")
        sys.exit(1)
    return [m for m in resp.json() if not m.get("is_processed") or not m.get("is_uploaded")]


# B2

def fetch_storage_credentials(api_url: str, headers: dict) -> dict | None:
    resp = httpx.get(f"{api_url}/api/storage-providers", headers=headers, timeout=30.0)
    if resp.status_code != 200 or not resp.json():
        return None
    providers = resp.json()
    if len(providers) == 1:
        provider_id = providers[0]["id"]
    else:
        print("Multiple storage providers found:")
        for i, p in enumerate(providers, 1):
            print(f"  {i}. {p['name']} (bucket: {p['bucket_name']})")
        raw = input(f"Select provider for B2 cleanup [1-{len(providers)}]: ").strip()
        if not raw.isdigit() or not (1 <= int(raw) <= len(providers)):
            return None
        provider_id = providers[int(raw) - 1]["id"]

    cred_resp = httpx.get(
        f"{api_url}/api/storage-providers/{provider_id}/credentials",
        headers=headers,
        timeout=30.0,
    )
    if cred_resp.status_code != 200:
        return None
    creds = cred_resp.json()
    return {
        "bucket_name": creds["bucket_name"],
        "endpoint_url": creds["endpoint_url"],
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

    print(f"    Scanning B2 for: {prefix}")
    paginator = s3.get_paginator("list_objects_v2")
    objects_to_delete = []
    for page in paginator.paginate(Bucket=bucket, Prefix=prefix):
        for obj in page.get("Contents", []):
            objects_to_delete.append({"Key": obj["Key"]})

    if not objects_to_delete:
        print("    No B2 files found for this movie.")
        return

    s3.delete_objects(
        Bucket=bucket,
        Delete={"Objects": objects_to_delete, "Quiet": True},
    )
    print(f"    Deleted {len(objects_to_delete)} file(s) from B2.")


# Delete

def delete_movie_record(api_url: str, headers: dict, movie: dict, b2_creds: dict | None) -> None:
    movie_id = movie["id"]
    title = movie["title"]
    resp = httpx.delete(f"{api_url}/api/movies/{movie_id}", headers=headers, timeout=30.0)
    if resp.status_code == 204:
        print(f"  [DB]  Deleted: \"{title}\"")
    else:
        print(f"  [DB]  FAILED to delete \"{title}\": {resp.status_code} {resp.text}")
        return

    if b2_creds:
        delete_b2_folder(movie_id, b2_creds)
    else:
        print(f"  [B2]  Skipped. Clean up manually: movies/{movie_id}/")


# Main

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Watch Party - Clean up orphaned (failed/incomplete) movie uploads.",
    )
    parser.add_argument("--api-url", default="http://localhost:8000", metavar="URL")
    parser.add_argument("--delete-b2", action="store_true", help="Auto-delete B2 files without prompting")
    args = parser.parse_args()
    api_url = args.api_url.rstrip("/")

    print("=" * 60)
    print("  Watch Party - Movie Cleanup Tool")
    print("=" * 60)
    print()

    token, headers = authenticate(api_url)

    print("Scanning for orphaned movie records...")
    orphans = fetch_orphaned_movies(api_url, headers)

    if not orphans:
        print("No orphaned movies found. Everything looks clean!")
        return

    print(f"Found {len(orphans)} orphaned movie(s):\n")
    print(f"  {'#':<4} {'Title':<35} {'Status':<22} {'Age'}")
    print(f"  {'-'*4} {'-'*35} {'-'*22} {'-'*12}")
    for i, m in enumerate(orphans, 1):
        parts = []
        if not m.get("is_processed"):
            parts.append("not processed")
        if not m.get("is_uploaded"):
            parts.append("not uploaded")
        status = ", ".join(parts) or "incomplete"
        age = format_age(m.get("created_at", ""))
        t = m["title"][:33] + ".." if len(m["title"]) > 35 else m["title"]
        print(f"  {i:<4} {t:<35} {status:<22} {age}")

    print()
    print("Which movies do you want to delete?")
    print("  Enter a number (e.g. '2'), comma-separated list (e.g. '1,3'), 'all', or 'q' to quit.")
    choice = input("\nChoice: ").strip().lower()

    if choice in ("q", ""):
        print("Aborted. No changes made.")
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
                print(f"Invalid selection '{part}'. Aborted.")
                return
        to_delete = [orphans[i] for i in indices]

    if not to_delete:
        print("Nothing selected. Aborted.")
        return

    # B2 cleanup
    b2_creds = None
    if args.delete_b2:
        clean_b2 = True
    else:
        ans = input(f"\nAlso delete associated files from Backblaze B2? [y/N]: ").strip().lower()
        clean_b2 = ans == "y"

    if clean_b2:
        print("Fetching B2 credentials...")
        b2_creds = fetch_storage_credentials(api_url, headers)
        if not b2_creds:
            print("Could not fetch B2 credentials. Skipping B2 deletion.")

    # Confirm
    print(f"\nAbout to permanently delete {len(to_delete)} movie record(s):")
    for m in to_delete:
        print(f"  - \"{m['title']}\" ({m['id']})")
    if b2_creds:
        print("  + Their B2 bucket files will also be removed.")
    else:
        print("  + B2 files will NOT be touched (delete manually if needed).")

    confirm = input("\nType 'yes' to confirm: ").strip().lower()
    if confirm != "yes":
        print("Aborted. No changes made.")
        return

    print()
    for m in to_delete:
        print(f"Deleting \"{m['title']}\"...")
        delete_movie_record(api_url, headers, m, b2_creds)

    print()
    print("=" * 60)
    print(f"  Done! Removed {len(to_delete)} orphaned record(s).")
    if not b2_creds:
        print("  Remember to manually clean up any B2 files if needed.")
    print("=" * 60)


if __name__ == "__main__":
    main()
