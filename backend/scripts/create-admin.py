#!/usr/bin/env python3
"""
Seed script to create the initial super_admin account.

Usage:
    cd backend
    python scripts/create-admin.py --username admin --email admin@example.com --password secret
"""

import argparse
import asyncio
import sys

from sqlalchemy import select

from app.core.security import get_password_hash
from app.db.session import async_session_maker
from app.models.enums import UserRole
from app.models.user import User


async def create_admin(username: str, email: str, password: str) -> None:
    async with async_session_maker() as session:
        # Check if any super_admin already exists
        stmt = select(User).where(User.role == UserRole.SUPER_ADMIN)
        result = await session.execute(stmt)
        if result.scalar_one_or_none() is not None:
            print("Error: A super_admin account already exists.")
            sys.exit(1)

        # Check if username/email is taken
        stmt = select(User).where((User.username == username) | (User.email == email))
        result = await session.execute(stmt)
        if result.first() is not None:
            print("Error: Username or email is already taken by another account.")
            sys.exit(1)

        hashed_password = get_password_hash(password)
        
        admin = User(
            username=username,
            email=email,
            hashed_password=hashed_password,
            role=UserRole.SUPER_ADMIN,
            is_active=True,
        )
        
        session.add(admin)
        await session.commit()
        
        print(f"Success: super_admin account '{username}' created.")


def main():
    parser = argparse.ArgumentParser(description="Create the initial super_admin account.")
    parser.add_argument("--username", required=True, help="Admin username")
    parser.add_argument("--email", required=True, help="Admin email")
    parser.add_argument("--password", required=True, help="Admin password")
    
    args = parser.parse_args()
    
    asyncio.run(create_admin(args.username, args.email, args.password))


if __name__ == "__main__":
    main()
