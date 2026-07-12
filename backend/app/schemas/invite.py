"""
Invite Pydantic schemas.
"""

from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import Field

from app.schemas.base import WatchPartyModel
from app.schemas.user import UserBrief


class InviteCreate(WatchPartyModel):
    """Request to generate a new invite."""
    room_id: uuid.UUID | None = None
    expires_in_hours: int = Field(default=48, ge=1, le=720)  # max 30 days
    max_uses: int = Field(default=1, ge=1, le=100)


class InviteResponse(WatchPartyModel):
    """Created invite response with the full invite link."""
    id: uuid.UUID
    token: str
    invite_url: str
    room_id: uuid.UUID | None
    inviter: UserBrief
    expires_at: datetime
    max_uses: int
    use_count: int
    is_revoked: bool
    is_valid: bool
    created_at: datetime


class InviteBrief(WatchPartyModel):
    """Info returned when validating an invite token before using it."""
    is_valid: bool
    room_id: uuid.UUID | None
    inviter_username: str
