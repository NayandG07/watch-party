import os
import sys
import httpx
from rich.console import Console

# Import the existing helpers from process.py
from process import (
    init_supabase,
    prompt_auth,
    verify_role,
    fetch_storage_provider,
    build_s3_client,
    configure_bucket_cors
)

console = Console()

def main():
    console.print("\n[bold cyan]Watch Party - Fix Bucket CORS[/]")
    console.print("This script will configure CORS on your Backblaze B2 bucket.")
    console.print("This allows the website to play videos directly from your bucket.\n")

    # Initialize Supabase client
    supabase = init_supabase()
    api_url = os.getenv("API_URL", "https://watch-party-u7jq.onrender.com").rstrip("/")

    # Prompt for authentication
    token = prompt_auth(supabase)
    headers = {"Authorization": f"Bearer {token}"}

    # Verify role
    verify_role(api_url, headers)

    # Fetch storage provider
    provider = fetch_storage_provider(api_url, headers)
    
    # Build Boto3 S3 Client
    s3_client = build_s3_client(provider)
    
    # Run the CORS configuration step
    configure_bucket_cors(s3_client, provider["bucket_name"])
    
    console.print("\n[bold green]✓ Done![/] Try playing the video on the website again.")

if __name__ == "__main__":
    main()
