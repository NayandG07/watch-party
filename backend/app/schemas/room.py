"""
Room and Chat Pydantic schemas.
"""

from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import Field

from app.models.enums import MessageType, RoomState
from app.schemas.base import WatchPartyModel
from app.schemas.movie import MovieBrief
from app.schemas.user import UserBrief


# ── Chat ──────────────────────────────────────────────────────────────────────

class ChatMessageCreate(WatchPartyModel):
    content: str = Field(..., min_length=1, max_length=2000)
    message_type: MessageType = MessageType.TEXT
    timestamp_reference: float | None = None


class ChatMessageResponse(WatchPartyModel):
    id: uuid.UUID
    user: UserBrief
    content: str
    message_type: MessageType
    timestamp_reference: float | None
    created_at: datetime


# ── Room Member ───────────────────────────────────────────────────────────────

class RoomMemberResponse(WatchPartyModel):
    user: UserBrief
    is_host: bool
    is_present: bool
    joined_at: datetime
    left_at: datetime | None


# ── Room ──────────────────────────────────────────────────────────────────────

class RoomCreate(WatchPartyModel):
    name: str = Field(..., min_length=1, max_length=100)
    movie_id: uuid.UUID | None = None
    external_url: str | None = None  # YouTube or other external video URL


class RoomSetMedia(WatchPartyModel):
    movie_id: uuid.UUID | None = None
    external_url: str | None = None


class RoomUpdate(WatchPartyModel):
    name: str | None = Field(default=None, max_length=100)
    is_locked: bool | None = None


class RoomResponse(WatchPartyModel):
    """Full room detail."""
    id: uuid.UUID
    slug: str
    name: str
    state: RoomState
    position_seconds: float
    speed: float
    is_locked: bool
    creator: UserBrief
    movie: MovieBrief | None = None
    external_url: str | None = None
    created_at: datetime
    last_activity_at: datetime


class RoomBrief(WatchPartyModel):
    """Minimal room info for list views."""
    id: uuid.UUID
    slug: str
    name: str
    state: RoomState
    movie_title: str | None = None
    member_count: int = 0


class WSTokenResponse(WatchPartyModel):
    ws_token: str
