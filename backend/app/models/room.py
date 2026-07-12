"""
Room ORM model.

A Room is the authoritative synchronization context for a watch session.
The Room owns the canonical timeline: position_seconds, state, and speed.

The Room clock calculation:
    current_position = position_seconds + (now - updated_at) * speed
    (only when state == PLAYING)

This is computed by the sync engine (app/sync/timeline.py) — NOT here.

Rooms are always invite-only. Joining requires an Invite token.
Room owners may lock the room after everyone has joined.

Room state survives backend restarts (persisted to PostgreSQL).
On reconnect, the WebSocket manager reloads state and re-broadcasts it.
"""

from __future__ import annotations

import uuid

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, String, func
from sqlalchemy import Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import RoomState

if TYPE_CHECKING:

    from app.models.chat_message import ChatMessage
    from app.models.invite import Invite
    from app.models.movie import Movie
    from app.models.room_member import RoomMember
    from app.models.user import User


class Room(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """A synchronized watch room with an authoritative timeline."""

    __tablename__ = "rooms"

    # ── Identity ──────────────────────────────────────────────────────────────
    # Short slug used in invite URLs (e.g. /room/abc123)
    slug: Mapped[str] = mapped_column(
        String(20),
        unique=True,
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)

    # ── Ownership ─────────────────────────────────────────────────────────────
    creator_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    movie_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("movies.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # ── Authoritative timeline ────────────────────────────────────────────────
    state: Mapped[RoomState] = mapped_column(
        SAEnum(RoomState, native_enum=False, length=10),
        nullable=False,
        default=RoomState.WAITING,
        server_default=RoomState.WAITING.value,
    )
    # Playback position at the time state last changed (seconds from start)
    position_seconds: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0.0,
        server_default="0",
    )
    # Playback speed (1.0 = normal, 1.5 = 50% faster, etc.)
    speed: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=1.0,
        server_default="1.0",
    )

    # ── Room control ──────────────────────────────────────────────────────────
    # is_locked=True prevents new users from joining even with a valid invite
    is_locked: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default="false",
    )
    # Tracks when the room was last active (for cleanup jobs)
    last_activity_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # ── Relationships ─────────────────────────────────────────────────────────
    creator: Mapped[User] = relationship(
        "User",
        foreign_keys=[creator_id],
        lazy="select",
    )
    movie: Mapped[Movie] = relationship(
        "Movie",
        back_populates="rooms",
        lazy="select",
    )
    members: Mapped[list[RoomMember]] = relationship(
        "RoomMember",
        back_populates="room",
        cascade="all, delete-orphan",
        lazy="select",
    )
    invites: Mapped[list[Invite]] = relationship(
        "Invite",
        back_populates="room",
        cascade="all, delete-orphan",
        lazy="select",
    )
    messages: Mapped[list[ChatMessage]] = relationship(
        "ChatMessage",
        back_populates="room",
        cascade="all, delete-orphan",
        lazy="select",
        order_by="ChatMessage.created_at",
    )

    def __repr__(self) -> str:
        return (
            f"<Room id={self.id} slug={self.slug!r} "
            f"state={self.state} pos={self.position_seconds:.1f}s>"
        )
