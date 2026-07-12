"""
RoomMember ORM model.

Join table between Room and User with additional fields:
- is_host: whether this user has host privileges (play/pause/seek)
- left_at: NULL while in the room, set when the user leaves

Composite primary key (room_id, user_id) ensures a user can only appear
once per room. A user rejoining a room after leaving will have a new row
(old row updated with left_at set; new row created).

Note: This does NOT inherit UUIDPrimaryKeyMixin — composite PK instead.
"""

from __future__ import annotations

import uuid

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:

    from app.models.room import Room
    from app.models.user import User


class RoomMember(Base):
    """A user's participation record in a Room."""

    __tablename__ = "room_members"

    # ── Composite primary key ─────────────────────────────────────────────────
    room_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("rooms.id", ondelete="CASCADE"),
        primary_key=True,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )

    # ── Member state ──────────────────────────────────────────────────────────
    is_host: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default="false",
    )
    # NULL = currently in the room; set when the user disconnects
    left_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # ── Relationships ─────────────────────────────────────────────────────────
    room: Mapped[Room] = relationship(
        "Room",
        back_populates="members",
        lazy="select",
    )
    user: Mapped[User] = relationship(
        "User",
        back_populates="room_memberships",
        lazy="select",
    )

    @property
    def is_present(self) -> bool:
        """True if the user has not left the room."""
        return self.left_at is None

    def __repr__(self) -> str:
        return (
            f"<RoomMember room={self.room_id} user={self.user_id} "
            f"host={self.is_host} present={self.is_present}>"
        )
