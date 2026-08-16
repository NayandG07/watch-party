import asyncio
from app.db.session import AsyncSessionLocal
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.models.storage_provider import StorageProvider
from app.core.security import decrypt_secret
import json

WORKER_URL = "https://billowing-king-8e25.nayandg8.workers.dev"

async def main():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(StorageProvider))
        providers = result.scalars().all()
        
        for sp in providers:
            endpoint = sp.endpoint_url or ""
            from urllib.parse import urlparse
            # Extract just the hostname from the endpoint URL
            if endpoint:
                b2_host = urlparse(endpoint).netloc or urlparse(endpoint).path
            else:
                b2_host = None

            print(f"Name: {sp.name}, Bucket: {sp.bucket_name}, Endpoint: {endpoint}, B2 Host: {b2_host}")

            if b2_host:
                new_cdn = f"{WORKER_URL}/{b2_host}"
                sp.cdn_url = new_cdn
                print(f"  -> Setting CDN URL to: {new_cdn}")
            else:
                print(f"  -> No endpoint URL set, skipping CDN update for this bucket.")

        await db.commit()
        print("\nDone! All buckets updated.")

asyncio.run(main())
