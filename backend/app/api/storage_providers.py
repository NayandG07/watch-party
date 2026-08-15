"""
Storage Provider API.

Allows Level 2+ users to register Backblaze B2, Cloudflare R2, or any
S3-compatible bucket. Credentials are AES-256-GCM encrypted at rest.

Endpoints:
  GET    /api/storage-providers          — List own providers
  POST   /api/storage-providers          — Register a new provider
  DELETE /api/storage-providers/{id}     — Remove a provider
  GET    /api/storage-providers/{id}/credentials — Decrypted creds (uploader)
"""

from __future__ import annotations

import json as _json
import uuid

import structlog
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field, ConfigDict, model_validator
from sqlalchemy import select

from app.core.dependencies import DatabaseDep, RequireLevel2Dep
from app.core.security import decrypt_secret, encrypt_secret
from app.core.storage_utils import extract_s3_creds
from app.models.enums import StorageProviderType
from app.models.movie import Movie
from app.models.storage_provider import StorageProvider

logger = structlog.get_logger()
router = APIRouter(prefix="/storage-providers", tags=["storage"])


# ── Credential schemas ────────────────────────────────────────────────────────


class B2Credentials(BaseModel):
    """Backblaze B2 Application Key credentials."""
    key_id: str = Field(..., description="Backblaze B2 Application Key ID")
    application_key: str = Field(..., description="Backblaze B2 Application Key")


class R2Credentials(BaseModel):
    """Cloudflare R2 API token credentials."""
    access_key_id: str = Field(..., description="R2 Access Key ID")
    secret_access_key: str = Field(..., description="R2 Secret Access Key")


class GenericS3Credentials(BaseModel):
    """Generic S3-compatible credentials (also used for MinIO)."""
    access_key_id: str
    secret_access_key: str


# ── Request / Response schemas ────────────────────────────────────────────────


class StorageProviderCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    provider_type: StorageProviderType = StorageProviderType.B2
    bucket_name: str = Field(..., min_length=1, max_length=255)
    endpoint_url: str | None = Field(
        None, description="S3-compatible endpoint URL"
    )
    cdn_url: str | None = Field(None, description="CDN base URL (optional)")

    # Accept both B2 and R2/S3 credential shapes — validated below
    credentials: B2Credentials | R2Credentials | GenericS3Credentials

    @model_validator(mode="after")
    def validate_credentials_for_type(self) -> "StorageProviderCreate":
        """Ensure the supplied credentials match the declared provider_type."""
        pt = self.provider_type
        creds = self.credentials

        if pt == StorageProviderType.B2 and not isinstance(creds, B2Credentials):
            raise ValueError("B2 providers require key_id and application_key")
        if pt in (StorageProviderType.R2, StorageProviderType.S3, StorageProviderType.MINIO):
            if not isinstance(creds, (R2Credentials, GenericS3Credentials)):
                raise ValueError(
                    f"{pt} providers require access_key_id and secret_access_key"
                )
        return self


class StorageProviderResponse(BaseModel):
    id: uuid.UUID
    name: str
    provider_type: StorageProviderType
    bucket_name: str
    endpoint_url: str | None
    cdn_url: str | None
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class StorageProviderCredentialsResponse(BaseModel):
    """Normalized decrypted credentials for the uploader script.

    Always returns access_key_id / secret_access_key regardless of the
    underlying provider type, so the uploader has a single code path.
    """
    provider_type: StorageProviderType
    access_key_id: str
    secret_access_key: str
    bucket_name: str
    endpoint_url: str | None


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


@router.get("/{provider_id}/credentials", response_model=StorageProviderCredentialsResponse)
async def get_storage_provider_credentials(
    provider_id: uuid.UUID,
    user_role_pair: RequireLevel2Dep,
    db: DatabaseDep,
) -> StorageProviderCredentialsResponse:
    """Return decrypted, normalized storage credentials for the uploader script.

    Only the owner (level2+) or a super_admin may call this endpoint.
    Credentials are decrypted on the fly and returned once — never stored
    in plaintext. Always returns normalized access_key_id/secret_access_key.
    """
    user_id, role = user_role_pair

    provider = await db.get(StorageProvider, provider_id)
    if not provider:
        raise HTTPException(status_code=404, detail="Storage provider not found")

    if role != "super_admin" and str(provider.owner_id) != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    try:
        creds = _json.loads(decrypt_secret(provider.credentials_encrypted))
    except (ValueError, KeyError) as exc:
        logger.error("credentials_decryption_failed", provider_id=str(provider_id), error=str(exc))
        raise HTTPException(status_code=500, detail="Failed to decrypt credentials") from exc

    access_key_id, secret_access_key = extract_s3_creds(provider.provider_type, creds)

    return StorageProviderCredentialsResponse(
        provider_type=provider.provider_type,
        access_key_id=access_key_id,
        secret_access_key=secret_access_key,
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

    # Serialize only the fields relevant to this provider type
    creds = payload.credentials
    if isinstance(creds, B2Credentials):
        creds_dict = {"key_id": creds.key_id.strip(), "application_key": creds.application_key.strip()}
    else:
        creds_dict = {
            "access_key_id": creds.access_key_id.strip(),
            "secret_access_key": creds.secret_access_key.strip(),
        }

    encrypted = encrypt_secret(_json.dumps(creds_dict))

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
    logger.info(
        "storage_provider_created",
        provider_id=str(provider.id),
        provider_type=payload.provider_type,
        bucket=payload.bucket_name,
    )
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

    stmt = select(Movie.id).where(Movie.storage_provider_id == provider_id)
    result = await db.execute(stmt)
    if result.first():
        raise HTTPException(
            status_code=400,
            detail="Cannot delete storage provider — it is still used by one or more movies. Delete the movies first.",
        )

    await db.delete(provider)
    await db.commit()
