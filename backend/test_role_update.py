import asyncio
import os

from dotenv import load_dotenv
from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.models.enums import UserRole
from app.models.user import User

load_dotenv()
db_url = os.getenv("DATABASE_URL")
engine = create_async_engine(db_url)
async_session = async_sessionmaker(engine, expire_on_commit=False)


async def main():
    async with async_session() as db:
        # Get a level1 user
        result = await db.execute(select(User).where(User.role == UserRole.LEVEL1).limit(1))
        user = result.scalar_one_or_none()

        if not user:
            print("No level1 user found")
            return

        print(f"Original role: {user.role.name} ({user.role.value})")

        try:
            # Try to update to level2
            user.role = UserRole.LEVEL2
            await db.commit()
            print("Successfully updated role!")

            await db.refresh(user)
            print(f"New role: {user.role.name} ({user.role.value})")

            # Revert
            user.role = UserRole.LEVEL1
            await db.commit()
        except Exception:
            import traceback

            traceback.print_exc()


asyncio.run(main())
