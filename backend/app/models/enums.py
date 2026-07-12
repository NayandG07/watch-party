"""
Shared enum definitions used across ORM models and Pydantic schemas.

Using `str` as the base for all enums ensures:
- Clean JSON serialisation (no need for `.value` calls)
- SQLAlchemy `native_enum=False` stores the string value directly
- Pydantic v2 validates and coerces string inputs automatically
"""

from __future__ import annotations

import enum


class UserRole(str, enum.Enum):
    """Platform user roles in ascending privilege order."""

    LEVEL1 = "level1"         # Default member: browse + watch + join rooms
    LEVEL2 = "level2"         # Trusted contributor: upload + manage own libraries
    SUPER_ADMIN = "super_admin"  # Platform owner: full access, single account


class Visibility(str, enum.Enum):
    """Content visibility levels for libraries, collections, and movies.

    Resolution order (lowest → highest override):
        Library (is_private) → Collection (visibility) → Movie (visibility_override)
    """

    PRIVATE = "private"   # Owner only
    FRIENDS = "friends"   # Explicit grants via the Permission table
    SHARED = "shared"     # All authenticated platform users


class StorageProviderType(str, enum.Enum):
    """Supported object storage backends.

    The application never calls storage APIs directly — it always goes through
    the StorageProvider interface in app/services/storage/base.py.
    """

    B2 = "b2"         # Backblaze B2 (current default)
    R2 = "r2"         # Cloudflare R2
    S3 = "s3"         # Amazon S3 (or compatible)
    MINIO = "minio"   # Self-hosted MinIO


class RoomState(str, enum.Enum):
    """Authoritative playback state of a watch room."""

    WAITING = "waiting"   # Room created, movie not started
    PLAYING = "playing"   # Timeline is advancing
    PAUSED = "paused"     # Timeline is frozen
    ENDED = "ended"       # Movie reached the end (or manually ended)


class MessageType(str, enum.Enum):
    """Chat message types within a room."""

    TEXT = "text"                       # Plain text message
    EMOJI_REACTION = "emoji_reaction"   # Single emoji reaction
    TIMESTAMP_SHARE = "timestamp_share" # Clickable playback position link
