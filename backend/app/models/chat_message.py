"""
ChatMessage ORM model.

In-room chat messages sent over the WebSocket connection.
Three message types:
- text: plain text
- emoji_reaction: single emoji character
- timestamp_share: a clickable playback position link
  (timestamp_reference stores the seconds value)

Chat history is tied to the room lifetime.
When a room is deleted, all messages are deleted (CASCADE).
There is no public chat, no cross-room history.
"""

from __future__ import annotations

import uuid

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Float, ForeignKey, Text, func
from sqlalchemy import Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, UUIDPrimaryKeyMixin
from app.models.enums import MessageType

if TYPE_CHECKING:

    from app.models.room import Room
    from app.models.user import User


class ChatMessage(Base, UUIDPrimaryKeyMixin):
    """A single chat message within a Room."""

    __tablename__ = "chat_messages"

    # ── Ownership ─────────────────────────────────────────────────────────────
    room_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("rooms.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    # ── Content ───────────────────────────────────────────────────────────────
    content: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        comment="For TEXT: message text. For EMOJI_REACTION: emoji char. "
                "For TIMESTAMP_SHARE: human-readable label e.g. '1:23:45'.",
    )
    message_type: Mapped[MessageType] = mapped_column(
        SAEnum(MessageType, native_enum=False, length=20),
        nullable=False,
        default=MessageType.TEXT,
        server_default=MessageType.TEXT.value,
    )
    # Playback position in seconds. Non-null only for TIMESTAMP_SHARE.
    timestamp_reference: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
        comment="Playback position in seconds for TIMESTAMP_SHARE messages.",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,   # Messages are queried in chronological order
    )

    # ── Relationships ─────────────────────────────────────────────────────────
    room: Mapped[Room] = relationship(
        "Room",
        back_populates="messages",
        lazy="select",
    )
    user: Mapped[User] = relationship(
        "User",
        back_populates="chat_messages",
        lazy="select",
    )

    def __repr__(self) -> str:
        return (
            f"<ChatMessage id={self.id} room={self.room_id} "
            f"type={self.message_type} user={self.user_id}>"
        )
