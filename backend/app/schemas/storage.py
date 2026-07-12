"""
Storage provider Pydantic schemas.

Credential fields are WRITE-ONLY.
The response schema never returns credentials_encrypted or any plaintext credentials.
"""

from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import AnyHttpUrl, Field

from app.models.enums import StorageProviderType
from app.schemas.base import WatchPartyModel


# ── Request schemas ───────────────────────────────────────────────────────────

class StorageProviderCreate(WatchPartyModel):
    """Register a new storage provider bucket."""

    provider_type: StorageProviderType
    name: str = Field(..., min_length=1, max_length=100)
    bucket_name: str = Field(..., min_length=1, max_length=255)
    endpoint_url: str | None = Field(
        default=None,
        description="S3-compatible endpoint. Required for MinIO/R2.",
    )
    cdn_url: str | None = Field(
        default=None,
        description="CDN origin that proxies this bucket (e.g. Cloudflare).",
    )

    # Credentials — validated at the service layer, never persisted as-is
    # B2:    key_id + application_key
    # R2:    account_id + access_key_id + secret_access_key
    # S3:    access_key_id + secret_access_key + region
    # MinIO: access_key + secret_key
    credentials: dict[str, str] = Field(
        ...,
        description="Provider-specific credentials. Encrypted before storage.",
    )


class StorageProviderUpdate(WatchPartyModel):
    """Update mutable fields of a storage provider."""
    name: str | None = Field(default=None, max_length=100)
    cdn_url: str | None = None
    endpoint_url: str | None = None
    is_active: bool | None = None
    credentials: dict[str, str] | None = Field(
        default=None,
        description="If provided, replaces the encrypted credentials.",
    )


# ── Response schemas ──────────────────────────────────────────────────────────

class StorageProviderResponse(WatchPartyModel):
    """Safe response — credentials are NEVER included."""
    id: uuid.UUID
    owner_id: uuid.UUID
    provider_type: StorageProviderType
    name: str
    bucket_name: str
    endpoint_url: str | None
    cdn_url: str | None
    is_active: bool
    created_at: datetime


class StorageProviderBrief(WatchPartyModel):
    """Minimal storage provider info for embedding in Library responses."""
    id: uuid.UUID
    provider_type: StorageProviderType
    name: str
    bucket_name: str
