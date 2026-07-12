"""
Invite ORM model.

Handles two types of invitations:
1. Platform registration invites (room_id = NULL) — created by super_admin
2. Room join invites (room_id = UUID) — created by anyone in the room

The invite token is the JWT string itself (so the backend can validate it
without a DB lookup in the fast path, then check revocation in the DB).

Expiry, max_uses, and is_revoked are enforced in the invite service layer.
"""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    import uuid

    from app.models.room import Room
    from app.models.user import User


class Invite(Base, UUIDPrimaryKeyMixin):
    """An invitation token for platform registration or room access."""

    __tablename__ = "invites"

    # ── Token ─────────────────────────────────────────────────────────────────
    # The signed JWT string (from security.create_invite_token()).
    # Stored so we can revoke it without waiting for expiry.
    token: Mapped[str] = mapped_column(
        String(1024),
        unique=True,
        nullable=False,
        index=True,
    )

    # ── Ownership ─────────────────────────────────────────────────────────────
    invited_by_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    # NULL = platform registration invite; set = room join invite
    room_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("rooms.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )

    # ── Usage limits ──────────────────────────────────────────────────────────
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
    max_uses: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=1,
        server_default="1",
    )
    use_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
    )
    is_revoked: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default="false",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # ── Relationships ─────────────────────────────────────────────────────────
    inviter: Mapped[User] = relationship(
        "User",
        foreign_keys=[invited_by_id],
        back_populates="invites_sent",
        lazy="select",
    )
    room: Mapped[Room | None] = relationship(
        "Room",
        back_populates="invites",
        lazy="select",
    )

    @property
    def is_valid(self) -> bool:
        """Quick validity check (does not check DB revocation)."""
        from datetime import timezone
        return (
            not self.is_revoked
            and self.use_count < self.max_uses
            and datetime.now(timezone.utc) < self.expires_at
        )

    def __repr__(self) -> str:
        target = f"room={self.room_id}" if self.room_id else "registration"
        return (
            f"<Invite id={self.id} {target} "
            f"uses={self.use_count}/{self.max_uses} "
            f"revoked={self.is_revoked}>"
        )
