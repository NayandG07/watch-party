"""
Shared schema base classes and common response types.

All Pydantic v2 schemas inherit from WatchPartyModel (which enables
from_attributes=True for ORM compatibility) or from a simpler BaseModel.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict

T = TypeVar("T")


class WatchPartyModel(BaseModel):
    """Base for all schemas that may be populated from ORM instances."""

    model_config = ConfigDict(
        from_attributes=True,       # Allow model_validate(orm_instance)
        populate_by_name=True,      # Allow both alias and field name
        use_enum_values=True,       # Serialise enums as their .value
    )


class PaginatedResponse(WatchPartyModel, Generic[T]):
    """Generic paginated list response."""

    items: list[T]
    total: int
    page: int
    page_size: int
    has_next: bool
    has_prev: bool


class MessageResponse(BaseModel):
    """Simple message/acknowledgement response."""

    message: str
