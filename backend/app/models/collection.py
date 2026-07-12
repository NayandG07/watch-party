"""
Collection ORM model.

A Collection is a named group of movies within a Library.
Permissions are primarily assigned at the collection level.
Individual movies may override with visibility_override.

Default visibility is always private.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy import Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import Visibility

if TYPE_CHECKING:
    import uuid

    from app.models.library import Library
    from app.models.movie import Movie
    from app.models.permission import Permission


class Collection(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """A named group of movies within a Library."""

    __tablename__ = "collections"

    # ── Ownership ─────────────────────────────────────────────────────────────
    library_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("libraries.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # ── Metadata ──────────────────────────────────────────────────────────────
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Relative path to the poster image in the storage bucket
    poster_path: Mapped[str | None] = mapped_column(String(512), nullable=True)
    # UI ordering (lower = shown first)
    sort_order: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
    )

    # ── Visibility ────────────────────────────────────────────────────────────
    visibility: Mapped[Visibility] = mapped_column(
        SAEnum(Visibility, native_enum=False, length=10),
        nullable=False,
        default=Visibility.PRIVATE,
        server_default=Visibility.PRIVATE.value,
    )

    # ── Relationships ─────────────────────────────────────────────────────────
    library: Mapped[Library] = relationship(
        "Library",
        back_populates="collections",
        lazy="select",
    )
    movies: Mapped[list[Movie]] = relationship(
        "Movie",
        back_populates="collection",
        cascade="all, delete-orphan",
        lazy="select",
        order_by="Movie.title",
    )
    permissions: Mapped[list[Permission]] = relationship(
        "Permission",
        primaryjoin="Permission.collection_id == Collection.id",
        back_populates="collection",
        lazy="select",
    )

    def __repr__(self) -> str:
        return (
            f"<Collection id={self.id} name={self.name!r} "
            f"visibility={self.visibility}>"
        )
