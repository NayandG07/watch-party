"""
Pydantic schemas package.
"""

from app.schemas.base import MessageResponse, PaginatedResponse, WatchPartyModel
from app.schemas.invite import InviteBrief, InviteCreate, InviteResponse
from app.schemas.library import (
    CollectionBrief,
    CollectionCreate,
    CollectionResponse,
    CollectionUpdate,
    LibraryBrief,
    LibraryCreate,
    LibraryResponse,
    LibraryUpdate,
)
from app.schemas.movie import (
    AudioTrack,
    Chapter,
    MovieBrief,
    MovieCreate,
    MovieResponse,
    MovieUpdate,
    MovieUploaderUpdate,
    PlaybackTokenResponse,
    SubtitleTrack,
)
from app.schemas.permission import PermissionCreate, PermissionResponse
from app.schemas.room import (
    ChatMessageCreate,
    ChatMessageResponse,
    RoomBrief,
    RoomCreate,
    RoomMemberResponse,
    RoomResponse,
    RoomUpdate,
    WSTokenResponse,
)
from app.schemas.storage import (
    StorageProviderBrief,
    StorageProviderCreate,
    StorageProviderResponse,
    StorageProviderUpdate,
)
from app.schemas.user import (
    LoginResponse,
    TokenRefreshResponse,
    UserBrief,
    UserLogin,
    UserRegister,
    UserResponse,
    UserUpdate,
)

__all__ = [
    "AudioTrack",
    "Chapter",
    "ChatMessageCreate",
    "ChatMessageResponse",
    "CollectionBrief",
    "CollectionCreate",
    "CollectionResponse",
    "CollectionUpdate",
    "InviteBrief",
    "InviteCreate",
    "InviteResponse",
    "LibraryBrief",
    "LibraryCreate",
    "LibraryResponse",
    "LibraryUpdate",
    "LoginResponse",
    "MessageResponse",
    "MovieBrief",
    "MovieCreate",
    "MovieResponse",
    "MovieUpdate",
    "MovieUploaderUpdate",
    "PaginatedResponse",
    "PermissionCreate",
    "PermissionResponse",
    "PlaybackTokenResponse",
    "RoomBrief",
    "RoomCreate",
    "RoomMemberResponse",
    "RoomResponse",
    "RoomUpdate",
    "StorageProviderBrief",
    "StorageProviderCreate",
    "StorageProviderResponse",
    "StorageProviderUpdate",
    "SubtitleTrack",
    "TokenRefreshResponse",
    "UserBrief",
    "UserLogin",
    "UserRegister",
    "UserResponse",
    "UserUpdate",
    "WSTokenResponse",
    "WatchPartyModel",
]
