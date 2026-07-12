"""
Movie Pydantic schemas.

Contains schemas for creating, updating, and viewing movies.
Also includes the playback token response.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from pydantic import Field

from app.models.enums import Visibility
from app.schemas.base import WatchPartyModel
from app.schemas.library import CollectionBrief


# ── Sub-schemas for JSONB fields ──────────────────────────────────────────────

class AudioTrack(WatchPartyModel):
    index: int
    language: str | None = None
    label: str | None = None
    codec: str | None = None
    channels: int | None = None


class SubtitleTrack(WatchPartyModel):
    index: int
    language: str | None = None
    label: str | None = None
    format: str | None = None  # vtt, srt, ass


class Chapter(WatchPartyModel):
    start_seconds: float
    title: str


# ── Request schemas ───────────────────────────────────────────────────────────

class MovieCreate(WatchPartyModel):
    """Initial creation (usually by the uploader script before processing)."""
    collection_id: uuid.UUID
    title: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    year: int | None = Field(default=None, ge=1888, le=2100)
    visibility_override: Visibility | None = None
    external_ids: dict[str, Any] = Field(default_factory=dict)


class MovieUpdate(WatchPartyModel):
    """Updates from the UI (metadata editing)."""
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    year: int | None = Field(default=None, ge=1888, le=2100)
    visibility_override: Visibility | None = None
    # Manual metadata overrides (merged into enriched_metadata)
    enriched_metadata: dict[str, Any] | None = None


class MovieUploaderUpdate(WatchPartyModel):
    """Updates from the uploader script (after FFprobe/FFmpeg)."""
    duration_seconds: float
    codec: str | None = None
    resolution_width: int | None = None
    resolution_height: int | None = None
    file_size_bytes: int | None = None
    audio_tracks: list[AudioTrack] = Field(default_factory=list)
    subtitle_tracks: list[SubtitleTrack] = Field(default_factory=list)
    chapters: list[Chapter] = Field(default_factory=list)
    
    # Paths (relative to bucket root)
    hls_master_path: str
    thumbnail_path: str | None = None
    poster_path: str | None = None
    backdrop_path: str | None = None
    timeline_sprite_path: str | None = None
    
    # HLS AES-128 key
    hls_key_hex: str = Field(..., min_length=32, max_length=32, description="16-byte hex")
    hls_iv_hex: str = Field(..., min_length=32, max_length=32, description="16-byte hex")
    
    is_processed: bool = True
    is_uploaded: bool = True


# ── Response schemas ──────────────────────────────────────────────────────────

class MovieResponse(WatchPartyModel):
    """Full movie detail response."""
    id: uuid.UUID
    collection_id: uuid.UUID
    title: str
    slug: str
    description: str | None
    year: int | None
    duration_seconds: float
    
    visibility_override: Visibility | None
    
    codec: str | None
    resolution: str | None
    
    audio_tracks: list[AudioTrack]
    subtitle_tracks: list[SubtitleTrack]
    chapters: list[Chapter]
    
    external_ids: dict[str, Any]
    enriched_metadata: dict[str, Any]
    
    is_processed: bool
    is_uploaded: bool
    created_at: datetime
    
    collection: CollectionBrief
    
    # These paths are translated to CDN URLs at the service layer
    # before returning to the frontend.
    thumbnail_url: str | None = None
    poster_url: str | None = None
    backdrop_url: str | None = None
    timeline_sprite_url: str | None = None


class MovieBrief(WatchPartyModel):
    """Minimal movie info for list views."""
    id: uuid.UUID
    title: str
    slug: str
    year: int | None
    duration_seconds: float
    resolution: str | None
    is_processed: bool
    is_uploaded: bool
    thumbnail_url: str | None = None
    poster_url: str | None = None


class PlaybackTokenResponse(WatchPartyModel):
    """Response when requesting to play a movie."""
    hls_url: str
    hls_key_token: str
    expires_at: datetime
