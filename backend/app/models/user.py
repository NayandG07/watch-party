"""
User ORM model.

Represents a platform member. Authentication (password, session, OTP) is
delegated to Supabase Auth. The user.id UUID maps 1:1 with auth.users.id
and is populated via a PostgreSQL trigger on new Supabase signup.

Privacy: User profiles are never exposed publicly.
         Presence, activity, and last-seen are never tracked.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import Boolean, String
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import UserRole

if TYPE_CHECKING:
    from app.models.chat_message import ChatMessage
    from app.models.invite import Invite
    from app.models.library import Library
    from app.models.permission import Permission
    from app.models.room_member import RoomMember
    from app.models.storage_provider import StorageProvider


class User(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Platform user account."""

    __tablename__ = "users"

    # ── Identity ──────────────────────────────────────────────────────────────
    # NOTE: id is NOT auto-generated here. It is set explicitly from
    # Supabase auth.users.id via a PostgreSQL trigger on signup.
    username: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
        index=True,
    )
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
    )

    # ── Role & status ─────────────────────────────────────────────────────────
    role: Mapped[UserRole] = mapped_column(
        SAEnum(UserRole, native_enum=False, length=20, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=UserRole.LEVEL1,
        server_default=UserRole.LEVEL1.value,
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default="true",
    )

    # ── Relationships ─────────────────────────────────────────────────────────
    storage_providers: Mapped[list[StorageProvider]] = relationship(
        "StorageProvider",
        back_populates="owner",
        cascade="all, delete-orphan",
        lazy="select",
    )
    libraries: Mapped[list[Library]] = relationship(
        "Library",
        back_populates="owner",
        cascade="all, delete-orphan",
        lazy="select",
    )
    room_memberships: Mapped[list[RoomMember]] = relationship(
        "RoomMember",
        back_populates="user",
        lazy="select",
    )
    invites_sent: Mapped[list[Invite]] = relationship(
        "Invite",
        foreign_keys="Invite.invited_by_id",
        back_populates="inviter",
        lazy="select",
    )
    chat_messages: Mapped[list[ChatMessage]] = relationship(
        "ChatMessage",
        back_populates="user",
        lazy="select",
    )
    permissions_granted: Mapped[list[Permission]] = relationship(
        "Permission",
        foreign_keys="Permission.granted_by_id",
        back_populates="granter",
        lazy="select",
    )
    permissions_received: Mapped[list[Permission]] = relationship(
        "Permission",
        foreign_keys="Permission.grantee_id",
        back_populates="grantee",
        lazy="select",
    )

    def __repr__(self) -> str:
        return f"<User id={self.id} username={self.username!r} role={self.role}>"
