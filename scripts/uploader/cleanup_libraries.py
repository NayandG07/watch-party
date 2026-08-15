#!/usr/bin/env python3
"""
Watch Party - Clean up Empty Libraries
======================================
Finds and deletes any libraries that have 0 collections, 
allowing you to safely delete their attached storage providers.
"""

import os
import sys
from pathlib import Path
import httpx
from dotenv import load_dotenv
from supabase import create_client, Client
from rich.console import Console
from rich.prompt import Prompt, Confirm

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

def main() -> None:
    api_url = "https://watch-party-u7jq.onrender.com"
    console.print("\n[bold magenta]Watch Party - Empty Library Cleanup[/]")
    
    supabase = init_supabase()
    email = Prompt.ask("Email")
    password = Prompt.ask("Password", password=True)

    with console.status("[cyan]Authenticating...", spinner="dots"):
        try:
            response = supabase.auth.sign_in_with_password({"email": email, "password": password})
            access_token = response.session.access_token
        except Exception as e:
            console.print(f"[red bold]Authentication failed:[/] {e}")
            sys.exit(1)

    headers = {"Authorization": f"Bearer {access_token}"}
    
    with console.status("[cyan]Fetching libraries...", spinner="dots"):
        resp = httpx.get(f"{api_url}/api/libraries", headers=headers, timeout=30.0)
        if resp.status_code != 200:
            console.print(f"[red bold]Failed to list libraries:[/] {resp.text}")
            sys.exit(1)
            
    libraries = resp.json()
    empty_libraries = [lib for lib in libraries if lib.get("collection_count", 0) == 0]
    
    if not empty_libraries:
        console.print("[green]No empty libraries found![/]")
        return
        
    console.print(f"\n[bold]Found {len(empty_libraries)} empty librar(ies):[/]")
    for lib in empty_libraries:
        console.print(f"  - {lib['name']} [dim]({lib['id']})[/]")
        
    if Confirm.ask("\nDo you want to permanently delete these empty libraries?"):
        for lib in empty_libraries:
            with console.status(f"[cyan]Deleting {lib['name']}...", spinner="dots"):
                d_resp = httpx.delete(f"{api_url}/api/libraries/{lib['id']}", headers=headers, timeout=30.0)
                if d_resp.status_code == 204:
                    console.print(f"[green]✓ Deleted:[/] {lib['name']}")
                else:
                    console.print(f"[red bold]✗ Failed to delete {lib['name']}:[/] {d_resp.text}")
                    
        console.print("\n[green]Cleanup complete! You can now safely delete the bucket in the web UI.[/]")

if __name__ == "__main__":
    main()
