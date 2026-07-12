"""
Library ORM model.

A Library is the top-level container for a user's content.
It is always owned by a single user and backed by a single StorageProvider.
All media inside the library lives in that user's storage bucket.

Default visibility is always private.
"""

from __future__ import annotations

import uuid

from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:

    from app.models.collection import Collection
    from app.models.permission import Permission
    from app.models.storage_provider import StorageProvider
    from app.models.user import User


class Library(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Top-level content container owned by a single user."""

    __tablename__ = "libraries"

    # ── Ownership ─────────────────────────────────────────────────────────────
    owner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    storage_provider_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        # RESTRICT: don't allow deleting a storage provider that has libraries
        ForeignKey("storage_providers.id", ondelete="RESTRICT"),
        nullable=False,
    )

    # ── Metadata ──────────────────────────────────────────────────────────────
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # ── Visibility ────────────────────────────────────────────────────────────
    # is_private=True → only the owner can see this library at all.
    # Visibility of individual collections/movies is controlled separately.
    is_private: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default="true",
    )

    # ── Relationships ─────────────────────────────────────────────────────────
    owner: Mapped[User] = relationship(
        "User",
        back_populates="libraries",
        lazy="select",
    )
    storage_provider: Mapped[StorageProvider] = relationship(
        "StorageProvider",
        back_populates="libraries",
        lazy="select",
    )
    collections: Mapped[list[Collection]] = relationship(
        "Collection",
        back_populates="library",
        cascade="all, delete-orphan",
        lazy="select",
    )
    permissions: Mapped[list[Permission]] = relationship(
        "Permission",
        primaryjoin="Permission.library_id == Library.id",
        back_populates="library",
        lazy="select",
    )

    def __repr__(self) -> str:
        return f"<Library id={self.id} name={self.name!r} private={self.is_private}>"
