"""
Library & Collection Pydantic schemas.
"""

from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import Field

from app.models.enums import Visibility
from app.schemas.base import WatchPartyModel
from app.schemas.storage import StorageProviderBrief
from app.schemas.user import UserBrief


# ── Library ───────────────────────────────────────────────────────────────────

class LibraryCreate(WatchPartyModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: str | None = None
    storage_provider_id: uuid.UUID
    is_private: bool = True


class LibraryUpdate(WatchPartyModel):
    name: str | None = Field(default=None, max_length=100)
    description: str | None = None
    is_private: bool | None = None


class LibraryResponse(WatchPartyModel):
    id: uuid.UUID
    name: str
    description: str | None
    is_private: bool
    owner: UserBrief
    storage_provider: StorageProviderBrief
    collection_count: int = 0
    created_at: datetime


class LibraryBrief(WatchPartyModel):
    """Minimal library info for embedding in other responses."""
    id: uuid.UUID
    name: str
    is_private: bool
    owner: UserBrief


# ── Collection ────────────────────────────────────────────────────────────────

class CollectionCreate(WatchPartyModel):
    library_id: uuid.UUID
    name: str = Field(..., min_length=1, max_length=100)
    description: str | None = None
    visibility: Visibility = Visibility.PRIVATE
    sort_order: int = Field(default=0, ge=0)


class CollectionUpdate(WatchPartyModel):
    name: str | None = Field(default=None, max_length=100)
    description: str | None = None
    visibility: Visibility | None = None
    sort_order: int | None = Field(default=None, ge=0)


class CollectionResponse(WatchPartyModel):
    id: uuid.UUID
    library_id: uuid.UUID
    name: str
    description: str | None
    visibility: Visibility
    poster_path: str | None
    sort_order: int
    movie_count: int = 0
    created_at: datetime


class CollectionBrief(WatchPartyModel):
    """Minimal collection info for embedding in movie responses."""
    id: uuid.UUID
    name: str
    visibility: Visibility
    library: LibraryBrief
