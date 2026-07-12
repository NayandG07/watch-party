"""
User Pydantic schemas.

Passwords are write-only and NEVER included in responses.
The hashed_password field exists only on the ORM model.
"""

from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import EmailStr, Field, field_validator

from app.models.enums import UserRole
from app.schemas.base import WatchPartyModel


# ── Embedded (minimal, safe to include in other responses) ────────────────────

class UserBrief(WatchPartyModel):
    """Minimal user info — safe to embed in other responses."""
    id: uuid.UUID
    username: str
    role: UserRole


# ── Request schemas ───────────────────────────────────────────────────────────

class UserLogin(WatchPartyModel):
    """Credentials for POST /api/auth/login."""
    username: str = Field(..., min_length=1, max_length=50)
    password: str = Field(..., min_length=1)


class UserRegister(WatchPartyModel):
    """New account creation via POST /api/auth/register (requires invite token)."""
    invite_token: str
    username: str = Field(..., min_length=3, max_length=50, pattern=r"^[a-zA-Z0-9_-]+$")
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)

    @field_validator("username")
    @classmethod
    def username_lowercase(cls, v: str) -> str:
        return v.lower()


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


class LoginResponse(WatchPartyModel):
    """Response to a successful login."""
    access_token: str
    token_type: str = "bearer"
    user: UserBrief


class TokenRefreshResponse(WatchPartyModel):
    """Response to a successful token refresh."""
    access_token: str
    token_type: str = "bearer"
