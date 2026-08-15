"""
Check storage provider configuration and optionally update CDN URL.

Usage:
    python check_storage_providers.py                  # List all storage providers
    python check_storage_providers.py <id> <cdn_url>   # Update CDN URL for a provider
"""

import asyncio
import os
import sys

from dotenv import load_dotenv
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

load_dotenv()
db_url = os.getenv("DATABASE_URL")


async def list_providers():
    """List all storage providers and their configuration."""
    print(f"Connecting to database...")
    engine = create_async_engine(db_url)
    
    async with engine.connect() as conn:
        result = await conn.execute(
            text("""
                SELECT 
                    sp.id, 
                    sp.name, 
                    sp.provider_type, 
                    sp.bucket_name, 
                    sp.endpoint_url,
                    sp.cdn_url,
                    sp.is_active,
                    u.username as owner_username
                FROM storage_providers sp
                JOIN users u ON sp.owner_id = u.id
                ORDER BY sp.created_at DESC
            """)
        )
        providers = result.fetchall()
        
        if not providers:
            print("\n❌ No storage providers found.")
            return
        
        print(f"\n✅ Found {len(providers)} storage provider(s):\n")
        print("-" * 100)
        
        for p in providers:
            p_dict = dict(p._mapping)
            print(f"ID:           {p_dict['id']}")
            print(f"Name:         {p_dict['name']}")
            print(f"Owner:        {p_dict['owner_username']}")
            print(f"Type:         {p_dict['provider_type']}")
            print(f"Bucket:       {p_dict['bucket_name']}")
            print(f"Endpoint:     {p_dict['endpoint_url'] or '(not set)'}")
            print(f"CDN URL:      {p_dict['cdn_url'] or '⚠️  NOT SET (using backend proxy)'}")
            print(f"Active:       {'✅ Yes' if p_dict['is_active'] else '❌ No'}")
            print("-" * 100)
    
    await engine.dispose()
    
    print("\n💡 TIP: For better performance, set up a Cloudflare CDN proxy for your B2 bucket")
    print("    and update the CDN URL with:")
    print("    python check_storage_providers.py <provider-id> <cdn-url>\n")


async def update_cdn_url(provider_id: str, cdn_url: str):
    """Update CDN URL for a storage provider."""
    print(f"Connecting to database...")
    engine = create_async_engine(db_url)
    
    async with engine.begin() as conn:
        # Check if provider exists
        result = await conn.execute(
            text("SELECT id, name FROM storage_providers WHERE id = :id"),
            {"id": provider_id}
        )
        provider = result.fetchone()
        
        if not provider:
            print(f"\n❌ Storage provider with ID '{provider_id}' not found.")
            await engine.dispose()
            return
        
        # Update CDN URL
        await conn.execute(
            text("UPDATE storage_providers SET cdn_url = :cdn_url WHERE id = :id"),
            {"id": provider_id, "cdn_url": cdn_url}
        )
        
        print(f"\n✅ Updated CDN URL for provider '{provider['name']}'")
        print(f"   New CDN URL: {cdn_url}")
        print("\n⚠️  NOTE: This change takes effect immediately for new playback requests.")
        print("   Users may need to refresh their browsers to see the change.\n")
    
    await engine.dispose()


async def main():
    if len(sys.argv) == 1:
        # No arguments - list all providers
        await list_providers()
    elif len(sys.argv) == 3:
        # Two arguments - update CDN URL
        provider_id = sys.argv[1]
        cdn_url = sys.argv[2]
        
        # Validate CDN URL format
        if not cdn_url.startswith("http://") and not cdn_url.startswith("https://"):
            print("\n❌ CDN URL must start with http:// or https://")
            return
        
        await update_cdn_url(provider_id, cdn_url.rstrip("/"))
    else:
        print("Usage:")
        print("  python check_storage_providers.py                  # List all storage providers")
        print("  python check_storage_providers.py <id> <cdn_url>   # Update CDN URL")
        print("\nExample:")
        print("  python check_storage_providers.py 123e4567-e89b-12d3-a456-426614174000 https://cdn.example.com")


if __name__ == "__main__":
    asyncio.run(main())
