import asyncio
import os

from dotenv import load_dotenv
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

load_dotenv()
db_url = os.getenv("DATABASE_URL")


async def main():
    print(f"Connecting to {db_url}")
    engine = create_async_engine(db_url)
    async with engine.connect() as conn:
        result = await conn.execute(text("SELECT id, username, role, email FROM public.users"))
        users = result.fetchall()
        print(f"Found {len(users)} users:")
        for u in users:
            print(dict(u._mapping))
    await engine.dispose()


asyncio.run(main())
