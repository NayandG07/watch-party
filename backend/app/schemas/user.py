"""
User Pydantic schemas.

Authentication (login, register, OTP) is now handled entirely by Supabase Auth.
These schemas are used for profile management and admin endpoints only.
"""

from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import EmailStr

from app.models.enums import UserRole
from app.schemas.base import WatchPartyModel

# ── Embedded (minimal, safe to include in other responses) ────────────────────


class UserBrief(WatchPartyModel):
    """Minimal user info — safe to embed in other responses."""

    id: uuid.UUID
    username: str
    role: UserRole


# ── Request schemas ───────────────────────────────────────────────────────────


class UserUpdate(WatchPartyModel):
    """Admin update of a user account. All fields optional."""

    role: UserRole | None = None
    is_active: bool | None = None
    email: EmailStr | None = None


# ── Response schemas ──────────────────────────────────────────────────────────


class UserResponse(WatchPartyModel):
    """Full user profile response for GET /api/auth/me and admin endpoints."""

    id: uuid.UUID
    username: str
    email: str
    role: UserRole
    is_active: bool
    created_at: datetime
