"""
ORM Models package.

All model classes are imported here so that:
1. Alembic autogenerate sees all tables via Base.metadata.
2. SQLAlchemy's relationship resolution can find all mapped classes.
3. Application code can import from `app.models` directly.

Import order respects the foreign-key dependency graph:
    User → StorageProvider → Library → Collection → Movie → HLSKey
                                                           → Permission
    User + Movie → Room → RoomMember
                        → Invite
                        → ChatMessage
"""

from app.models.chat_message import ChatMessage
from app.models.collection import Collection
from app.models.enums import (
    MessageType,
    RoomState,
    StorageProviderType,
    UserRole,
    Visibility,
)
from app.models.hls_key import HLSKey
from app.models.invite import Invite
from app.models.library import Library
from app.models.movie import Movie
from app.models.permission import Permission
from app.models.room import Room
from app.models.room_member import RoomMember
from app.models.storage_provider import StorageProvider
from app.models.user import User

__all__ = [
    # Enums
    "MessageType",
    "RoomState",
    "StorageProviderType",
    "UserRole",
    "Visibility",
    # Models
    "ChatMessage",
    "Collection",
    "HLSKey",
    "Invite",
    "Library",
    "Movie",
    "Permission",
    "Room",
    "RoomMember",
    "StorageProvider",
    "User",
]
