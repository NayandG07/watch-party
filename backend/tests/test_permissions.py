import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.models.library import Library
from app.models.permission import Permission
from app.models.enums import UserRole
from app.core.security import create_access_token
import uuid

@pytest.fixture
async def test_admin(db_session: AsyncSession) -> User:
    from app.core.security import hash_password
    user = User(
        username="admin_perm",
        email="admin_perm@example.com",
        hashed_password=hash_password("password123"),
        role=UserRole.SUPER_ADMIN,
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    return user

@pytest.fixture
async def test_library(db_session: AsyncSession, test_admin: User) -> Library:
    lib = Library(
        name="Test Library",
        owner_id=test_admin.id,
        is_public=False
    )
    db_session.add(lib)
    await db_session.commit()
    return lib

@pytest.mark.asyncio
async def test_grant_permission(client: AsyncClient, test_admin: User, test_library: Library, db_session: AsyncSession):
    token = create_access_token(str(test_admin.id), role="super_admin")
    
    # Create another user to grant to
    from app.core.security import hash_password
    grantee = User(
        username="grantee",
        email="grantee@example.com",
        hashed_password=hash_password("pw"),
        role=UserRole.LEVEL1,
        is_active=True
    )
    db_session.add(grantee)
    await db_session.commit()
    await db_session.refresh(grantee)

    response = await client.post(
        "/api/permissions",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "grantee_id": str(grantee.id),
            "library_id": str(test_library.id),
        }
    )
    assert response.status_code == 201
    assert response.json()["grantee"]["username"] == "grantee"
