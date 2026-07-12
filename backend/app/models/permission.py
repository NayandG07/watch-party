"""
Permission ORM model.

Explicit access grants for the "friends" visibility level.
Exactly one of (library_id, collection_id, movie_id) must be non-null.
This is enforced by a PostgreSQL CHECK constraint using num_nonnulls().

When a collection has visibility="friends", only users with an explicit
Permission row (grantee_id = user.id, collection_id = collection.id) can see it.

Permission resolution order (most specific wins):
  1. movie.visibility_override (if not NULL)
  2. collection.visibility
  3. library.is_private

Super admins bypass all permission checks.
"""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    import uuid

    from app.models.collection import Collection
    from app.models.library import Library
    from app.models.movie import Movie
    from app.models.user import User


class Permission(Base, UUIDPrimaryKeyMixin):
    """Explicit access grant from one user to another for a content target."""

    __tablename__ = "permissions"

    # ── Parties ───────────────────────────────────────────────────────────────
    grantee_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    granted_by_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    # ── Target (exactly one must be non-null) ─────────────────────────────────
    library_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("libraries.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    collection_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("collections.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    movie_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("movies.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # ── Constraints ───────────────────────────────────────────────────────────
    __table_args__ = (
        # PostgreSQL's num_nonnulls() counts non-null arguments.
        # Exactly one target column must be populated.
        CheckConstraint(
            "num_nonnulls(library_id, collection_id, movie_id) = 1",
            name="ck_permissions_exactly_one_target",
        ),
    )

    # ── Relationships ─────────────────────────────────────────────────────────
    grantee: Mapped[User] = relationship(
        "User",
        foreign_keys=[grantee_id],
        back_populates="permissions_received",
        lazy="select",
    )
    granter: Mapped[User] = relationship(
        "User",
        foreign_keys=[granted_by_id],
        back_populates="permissions_granted",
        lazy="select",
    )
    library: Mapped[Library | None] = relationship(
        "Library",
        back_populates="permissions",
        lazy="select",
    )
    collection: Mapped[Collection | None] = relationship(
        "Collection",
        back_populates="permissions",
        lazy="select",
    )
    movie: Mapped[Movie | None] = relationship(
        "Movie",
        back_populates="permissions",
        lazy="select",
    )

    def __repr__(self) -> str:
        target = (
            f"library={self.library_id}"
            if self.library_id
            else f"collection={self.collection_id}"
            if self.collection_id
            else f"movie={self.movie_id}"
        )
        return f"<Permission id={self.id} grantee={self.grantee_id} {target}>"
