"""
Permission Pydantic schemas.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from pydantic import model_validator

from app.schemas.base import WatchPartyModel
from app.schemas.user import UserBrief


class PermissionCreate(WatchPartyModel):
    grantee_id: uuid.UUID
    library_id: uuid.UUID | None = None
    collection_id: uuid.UUID | None = None
    movie_id: uuid.UUID | None = None

    @model_validator(mode="before")
    @classmethod
    def check_exactly_one_target(cls, data: Any) -> Any:
        if isinstance(data, dict):
            targets = [
                data.get("library_id"),
                data.get("collection_id"),
                data.get("movie_id"),
            ]
            if sum(1 for t in targets if t is not None) != 1:
                raise ValueError("Exactly one of library_id, collection_id, or movie_id must be provided.")
        return data


class PermissionResponse(WatchPartyModel):
    id: uuid.UUID
    grantee: UserBrief
    granter: UserBrief
    library_id: uuid.UUID | None
    collection_id: uuid.UUID | None
    movie_id: uuid.UUID | None
    created_at: datetime
