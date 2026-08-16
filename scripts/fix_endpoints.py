import asyncio
from app.db.session import AsyncSessionLocal
from sqlalchemy import select
from app.models.storage_provider import StorageProvider

async def main():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(StorageProvider))
        providers = result.scalars().all()
        
        for sp in providers:
            endpoint = sp.endpoint_url or ""
            print(f"Name: {sp.name}, Bucket: {sp.bucket_name}")
            print(f"  Endpoint (raw): {repr(endpoint)}")
            print(f"  CDN URL: {sp.cdn_url}")
            
            # Fix endpoint URL — must have https:// scheme
            if endpoint and not endpoint.startswith("http"):
                fixed = f"https://{endpoint}"
                sp.endpoint_url = fixed
                print(f"  FIXING endpoint: {endpoint!r} -> {fixed!r}")
            print()

        await db.commit()
        print("Done. All endpoint URLs fixed.")

asyncio.run(main())
