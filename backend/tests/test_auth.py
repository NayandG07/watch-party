import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

import uuid

from app.models.user import User
from app.models.enums import UserRole
from app.core.security import hash_password

@pytest.fixture
async def test_user(db_session: AsyncSession) -> User:
    suffix = uuid.uuid4().hex
    user = User(
        username=f"testuser_{suffix}",
        email=f"test_{suffix}@example.com",
        hashed_password=hash_password("password123"),
        role=UserRole.LEVEL1,
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user

@pytest.mark.asyncio
async def test_login_success(client: AsyncClient, test_user: User):
    response = await client.post(
        "/api/auth/login",
        json={"username": test_user.username, "password": "password123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["username"] == test_user.username

@pytest.mark.asyncio
async def test_login_failure(client: AsyncClient, test_user: User):
    response = await client.post(
        "/api/auth/login",
        json={"username": test_user.username, "password": "wrongpassword"}
    )
    assert response.status_code == 401
