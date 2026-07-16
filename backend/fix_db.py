import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from dotenv import load_dotenv

load_dotenv()
db_url = os.getenv("DATABASE_URL")

async def main():
    print(f"Connecting to {db_url}")
    engine = create_async_engine(db_url)
    async with engine.connect() as conn:
        await conn.execute(text("UPDATE public.users SET role = LOWER(role)"))
        await conn.commit()
        print("Updated all user roles to lowercase.")
        
        result = await conn.execute(text("SELECT id, username, role FROM public.users"))
        users = result.fetchall()
        for u in users:
            print(dict(u._mapping))
    await engine.dispose()

asyncio.run(main())
