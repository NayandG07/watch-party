"""
StorageProvider ORM model.

Each Level 2+ user may register their own Backblaze B2 (or compatible) bucket.
Credentials are encrypted at rest using AES-256-GCM before being stored here.

The application decrypts credentials on demand via app.core.security.decrypt_secret().
Credentials are NEVER logged or included in API responses.

Future providers (R2, S3, MinIO) can be added without changing this schema —
only the StorageProvider ABC implementation changes.
"""

from __future__ import annotations

import uuid

from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, String, Text
from sqlalchemy import Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import StorageProviderType

if TYPE_CHECKING:

    from app.models.library import Library
    from app.models.user import User


class StorageProvider(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """An object storage bucket registered by a user.

    Library ownership and storage ownership are always linked:
    every Library must point to a StorageProvider that the same user owns.
    """

    __tablename__ = "storage_providers"

    # ── Ownership ─────────────────────────────────────────────────────────────
    owner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # ── Provider config ───────────────────────────────────────────────────────
    provider_type: Mapped[StorageProviderType] = mapped_column(
        SAEnum(StorageProviderType, native_enum=False, length=10),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        comment="Human-readable label shown in the UI, e.g. 'My B2 Movies Bucket'",
    )

    # ── Encrypted credentials ─────────────────────────────────────────────────
    # Stored as: AES-256-GCM(nonce + ciphertext), base64url-encoded.
    # Plaintext JSON structure depends on provider_type:
    #   B2  → {"key_id": "...", "application_key": "..."}
    #   R2  → {"account_id": "...", "access_key_id": "...", "secret_access_key": "..."}
    #   S3  → {"access_key_id": "...", "secret_access_key": "...", "region": "..."}
    #   MinIO → {"access_key": "...", "secret_key": "..."}
    credentials_encrypted: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        comment="AES-256-GCM encrypted JSON credentials. NEVER expose in responses.",
    )

    # ── Bucket config ─────────────────────────────────────────────────────────
    bucket_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    # Provider API endpoint (required for MinIO/R2; optional for B2 if using default)
    endpoint_url: Mapped[str | None] = mapped_column(
        String(512),
        nullable=True,
        comment="S3-compatible endpoint URL. e.g. https://s3.us-west-004.backblazeb2.com",
    )
    # Cloudflare CDN base URL that proxies this bucket (optional)
    cdn_url: Mapped[str | None] = mapped_column(
        String(512),
        nullable=True,
        comment="CDN origin URL e.g. https://cdn.example.com — served to clients",
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default="true",
    )

    # ── Relationships ─────────────────────────────────────────────────────────
    owner: Mapped[User] = relationship(
        "User",
        back_populates="storage_providers",
        lazy="select",
    )
    libraries: Mapped[list[Library]] = relationship(
        "Library",
        back_populates="storage_provider",
        lazy="select",
    )

    def __repr__(self) -> str:
        return (
            f"<StorageProvider id={self.id} type={self.provider_type} "
            f"bucket={self.bucket_name!r}>"
        )
