"""
Storage Provider API.

Allows Level 2+ users to register their Backblaze B2 (or compatible) bucket.
Credentials are AES-256-GCM encrypted before being stored in the database.

Endpoints:
  GET    /api/storage-providers          — List own providers
  POST   /api/storage-providers          — Register a new provider
  DELETE /api/storage-providers/{id}     — Remove a provider
"""

from __future__ import annotations

import uuid

import structlog
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select

import json as _json

from app.core.dependencies import DatabaseDep, RequireLevel2Dep
from app.core.security import decrypt_secret, encrypt_secret
from app.models.enums import StorageProviderType
from app.models.storage_provider import StorageProvider

logger = structlog.get_logger()
router = APIRouter(prefix="/storage-providers", tags=["storage"])


# ── Schemas ───────────────────────────────────────────────────────────────────

class B2Credentials(BaseModel):
    key_id: str = Field(..., description="Backblaze B2 Application Key ID")
    application_key: str = Field(..., description="Backblaze B2 Application Key")


class StorageProviderCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Human-readable label, e.g. 'My B2 Bucket'")
    provider_type: StorageProviderType = StorageProviderType.B2
    bucket_name: str = Field(..., min_length=1, max_length=255)
    endpoint_url: str | None = Field(None, description="S3-compatible endpoint, e.g. https://s3.us-west-004.backblazeb2.com")
    cdn_url: str | None = Field(None, description="CDN base URL, e.g. https://cdn.example.com")
    credentials: B2Credentials


class StorageProviderResponse(BaseModel):
    id: uuid.UUID
    name: str
    provider_type: StorageProviderType
    bucket_name: str
    endpoint_url: str | None
    cdn_url: str | None
    is_active: bool

    model_config = {"from_attributes": True}


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("", response_model=list[StorageProviderResponse])
async def list_storage_providers(
    user_role_pair: RequireLevel2Dep,
    db: DatabaseDep,
) -> list[StorageProvider]:
    user_id, _ = user_role_pair
    stmt = select(StorageProvider).where(StorageProvider.owner_id == uuid.UUID(user_id))
    result = await db.execute(stmt)
    return list(result.scalars().all())


class StorageProviderCredentialsResponse(BaseModel):
    """Decrypted credentials for a storage provider (uploader use only)."""
    key_id: str
    application_key: str
    bucket_name: str
    endpoint_url: str | None


@router.get("/{provider_id}/credentials", response_model=StorageProviderCredentialsResponse)
async def get_storage_provider_credentials(
    provider_id: uuid.UUID,
    user_role_pair: RequireLevel2Dep,
    db: DatabaseDep,
) -> StorageProviderCredentialsResponse:
    """Return decrypted storage credentials for the uploader script.

    Only the owner (level2+) or a super_admin may call this endpoint.
    The raw key_id and application_key are decrypted on the fly and
    returned once — they are never stored in plaintext.
    """
    user_id, role = user_role_pair

    provider = await db.get(StorageProvider, provider_id)
    if not provider:
        raise HTTPException(status_code=404, detail="Storage provider not found")

    # Owners and super_admins are allowed; everyone else is denied.
    if role != "super_admin" and str(provider.owner_id) != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this storage provider",
        )

    try:
        credentials_json = decrypt_secret(provider.credentials_encrypted)
        creds = _json.loads(credentials_json)
    except (ValueError, KeyError) as exc:
        logger.error("credentials_decryption_failed", provider_id=str(provider_id), error=str(exc))
        raise HTTPException(
            status_code=500,
            detail="Failed to decrypt storage credentials. Contact your administrator.",
        ) from exc

    return StorageProviderCredentialsResponse(
        key_id=creds["key_id"],
        application_key=creds["application_key"],
        bucket_name=provider.bucket_name,
        endpoint_url=provider.endpoint_url,
    )


@router.post("", response_model=StorageProviderResponse, status_code=status.HTTP_201_CREATED)
async def create_storage_provider(
    payload: StorageProviderCreate,
    user_role_pair: RequireLevel2Dep,
    db: DatabaseDep,
) -> StorageProvider:
    user_id, _ = user_role_pair

    credentials_json = _json.dumps({
        "key_id": payload.credentials.key_id,
        "application_key": payload.credentials.application_key,
    })
    encrypted = encrypt_secret(credentials_json)

    provider = StorageProvider(
        owner_id=uuid.UUID(user_id),
        name=payload.name,
        provider_type=payload.provider_type,
        bucket_name=payload.bucket_name,
        endpoint_url=payload.endpoint_url,
        cdn_url=payload.cdn_url,
        credentials_encrypted=encrypted,
        is_active=True,
    )
    db.add(provider)
    await db.commit()
    await db.refresh(provider)
    return provider


@router.delete("/{provider_id}", status_code=status.HTTP_204_NO_CONTENT, response_model=None)
async def delete_storage_provider(
    provider_id: uuid.UUID,
    user_role_pair: RequireLevel2Dep,
    db: DatabaseDep,
) -> None:
    user_id, _ = user_role_pair
    provider = await db.get(StorageProvider, provider_id)
    if not provider:
        raise HTTPException(status_code=404, detail="Storage provider not found")
    if str(provider.owner_id) != user_id:
        raise HTTPException(status_code=403, detail="Not your storage provider")
    await db.delete(provider)
    await db.commit()
