"""
Movie ORM model.

A Movie is a single playable media item within a Collection.
Storage paths are relative to the bucket root (never absolute URLs).
Absolute URLs are constructed at request time using the StorageProvider.

HLS AES-128 encryption: the encryption key is stored in the HLSKey table,
encrypted with the app's AES-256-GCM master key. The backend decrypts and
serves the key on demand; the B2 bucket only contains encrypted segments.

Metadata enrichment from TMDB/OMDB is stored in enriched_metadata (JSONB).
Manual overrides are also supported (stored in the same field).
"""

from __future__ import annotations

import uuid

from typing import TYPE_CHECKING, Any

from sqlalchemy import BigInteger, Boolean, Float, ForeignKey, Integer, String, Text
from sqlalchemy import Enum as SAEnum
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import Visibility

if TYPE_CHECKING:

    from app.models.collection import Collection
    from app.models.hls_key import HLSKey
    from app.models.permission import Permission
    from app.models.room import Room


class Movie(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """A single playable media item within a Collection."""

    __tablename__ = "movies"

    # ── Ownership ─────────────────────────────────────────────────────────────
    collection_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("collections.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # ── Core metadata ─────────────────────────────────────────────────────────
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    # URL-safe slug for deep linking. Generated from title, globally unique.
    slug: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    duration_seconds: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0.0,
        server_default="0",
    )

    # ── Storage paths (relative to bucket root — NEVER absolute URLs) ─────────
    # Use StorageProvider.generate_signed_url(path) to get a playable URL.
    hls_master_path: Mapped[str | None] = mapped_column(
        String(512),
        nullable=True,
        comment="e.g. movies/uuid/master.m3u8",
    )
    thumbnail_path: Mapped[str | None] = mapped_column(
        String(512),
        nullable=True,
        comment="Still frame thumbnail for list views",
    )
    poster_path: Mapped[str | None] = mapped_column(
        String(512),
        nullable=True,
        comment="Portrait poster image",
    )
    backdrop_path: Mapped[str | None] = mapped_column(
        String(512),
        nullable=True,
        comment="Wide backdrop image for movie detail page",
    )
    timeline_sprite_path: Mapped[str | None] = mapped_column(
        String(512),
        nullable=True,
        comment="WebVTT + JPEG sprite for seek bar thumbnail preview",
    )

    # ── Visibility override ───────────────────────────────────────────────────
    # NULL = inherit from collection.visibility
    visibility_override: Mapped[Visibility | None] = mapped_column(
        SAEnum(Visibility, native_enum=False, length=10),
        nullable=True,
    )

    # ── Technical metadata (from FFprobe during upload) ───────────────────────
    codec: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
        comment="Video codec: h264, h265, av1, vp9",
    )
    resolution_width: Mapped[int | None] = mapped_column(Integer, nullable=True)
    resolution_height: Mapped[int | None] = mapped_column(Integer, nullable=True)
    file_size_bytes: Mapped[int | None] = mapped_column(BigInteger, nullable=True)

    # ── Multi-track metadata (JSONB) ──────────────────────────────────────────
    # audio_tracks: [{index, language, label, codec, channels}]
    audio_tracks: Mapped[list[Any]] = mapped_column(
        JSONB,
        nullable=False,
        default=list,
        server_default="[]",
    )
    # subtitle_tracks: [{index, language, label, format}]  format: vtt|srt|ass
    subtitle_tracks: Mapped[list[Any]] = mapped_column(
        JSONB,
        nullable=False,
        default=list,
        server_default="[]",
    )
    # chapters: [{start_seconds, title}]
    chapters: Mapped[list[Any]] = mapped_column(
        JSONB,
        nullable=False,
        default=list,
        server_default="[]",
    )

    # ── External IDs ──────────────────────────────────────────────────────────
    # {tmdb_id, imdb_id, omdb_id}
    external_ids: Mapped[dict[str, Any]] = mapped_column(
        JSONB,
        nullable=False,
        default=dict,
        server_default="{}",
    )

    # ── Enriched metadata from TMDB/OMDB ──────────────────────────────────────
    # Includes: overview, tagline, genres, cast, director, rating, poster_url, etc.
    # Manual overrides are merged into this field at save time.
    enriched_metadata: Mapped[dict[str, Any]] = mapped_column(
        JSONB,
        nullable=False,
        default=dict,
        server_default="{}",
    )

    # ── Processing state ──────────────────────────────────────────────────────
    # is_processed: FFmpeg HLS encoding completed
    is_processed: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default="false",
    )
    # is_uploaded: all HLS segments + metadata uploaded to B2
    is_uploaded: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default="false",
    )

    # ── Relationships ─────────────────────────────────────────────────────────
    collection: Mapped[Collection] = relationship(
        "Collection",
        back_populates="movies",
        lazy="select",
    )
    hls_key: Mapped[HLSKey | None] = relationship(
        "HLSKey",
        back_populates="movie",
        uselist=False,
        cascade="all, delete-orphan",
        lazy="select",
    )
    permissions: Mapped[list[Permission]] = relationship(
        "Permission",
        primaryjoin="Permission.movie_id == Movie.id",
        back_populates="movie",
        lazy="select",
    )
    rooms: Mapped[list[Room]] = relationship(
        "Room",
        back_populates="movie",
        lazy="select",
    )

    @property
    def resolution(self) -> str | None:
        """Human-readable resolution string e.g. '1920x1080'."""
        if self.resolution_width and self.resolution_height:
            return f"{self.resolution_width}x{self.resolution_height}"
        return None

    def __repr__(self) -> str:
        return f"<Movie id={self.id} title={self.title!r} slug={self.slug!r}>"
