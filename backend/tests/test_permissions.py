import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

import uuid

from app.core.security import create_access_token
from app.models.enums import StorageProviderType, UserRole
from app.models.library import Library
from app.models.storage_provider import StorageProvider
from app.models.user import User

@pytest.fixture
async def test_admin(db_session: AsyncSession) -> User:
    from app.core.security import hash_password
    suffix = uuid.uuid4().hex
    user = User(
        username=f"admin_perm_{suffix}",
        email=f"admin_perm_{suffix}@example.com",
        hashed_password=hash_password("password123"),
        role=UserRole.SUPER_ADMIN,
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    return user

@pytest.fixture
async def test_library(db_session: AsyncSession, test_admin: User) -> Library:
    provider = StorageProvider(
        owner_id=test_admin.id,
        provider_type=StorageProviderType.B2,
        name="Test Provider",
        credentials_encrypted="{}",
        bucket_name="test-bucket",
        endpoint_url="https://example.invalid",
        is_active=True,
    )
    db_session.add(provider)
    await db_session.flush()

    lib = Library(
        name="Test Library",
        owner_id=test_admin.id,
        storage_provider_id=provider.id,
        is_private=True,
    )
    db_session.add(lib)
    await db_session.commit()
    return lib

@pytest.mark.asyncio
async def test_grant_permission(client: AsyncClient, test_admin: User, test_library: Library, db_session: AsyncSession):
    token = create_access_token(str(test_admin.id), role="super_admin")
    
    # Create another user to grant to
    from app.core.security import hash_password
    suffix = uuid.uuid4().hex
    grantee = User(
        username=f"grantee_{suffix}",
        email=f"grantee_{suffix}@example.com",
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
    assert response.json()["grantee"]["username"] == grantee.username
