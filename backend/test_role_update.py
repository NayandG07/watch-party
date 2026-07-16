import asyncio
import os
import uuid
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy import select
from dotenv import load_dotenv

from app.models.user import User
from app.models.enums import UserRole

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
            setattr(user, 'role', UserRole.LEVEL2)
            await db.commit()
            print("Successfully updated role!")
            
            await db.refresh(user)
            print(f"New role: {user.role.name} ({user.role.value})")
            
            # Revert
            setattr(user, 'role', UserRole.LEVEL1)
            await db.commit()
        except Exception as e:
            import traceback
            traceback.print_exc()

asyncio.run(main())
