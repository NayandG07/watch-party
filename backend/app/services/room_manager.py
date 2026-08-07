"""
Room Manager â€” in-memory WebSocket connection registry with DB-persisted state.

Architecture:
  - One RoomManager singleton lives for the lifetime of the process.
  - On reconnect / restart, the manager reloads authoritative state from DB.
  - The canonical position formula is:
      pos = position_seconds + (now - updated_at).total_seconds() * speed
    (only when state == PLAYING)

Thread safety:
  - asyncio is single-threaded, so plain dicts are safe here.
  - Guard any external integration (e.g. Redis pub/sub) with asyncio.Lock.
"""

from __future__ import annotations

import contextlib
from datetime import UTC, datetime
from typing import TYPE_CHECKING

import structlog
from fastapi import WebSocket

from app.models.enums import RoomState

if TYPE_CHECKING:
    from app.models.room import Room

logger = structlog.get_logger()


class RoomStateLive:
    """Lightweight in-memory snapshot of a room's playback state."""

    __slots__ = (
        "room_id",
        "state",
        "position_seconds",
        "speed",
        "host_id",
        "updated_at",
    )

    def __init__(
        self,
        room_id: str,
        state: RoomState,
        position_seconds: float,
        speed: float,
        host_id: str,
        updated_at: datetime | None = None,
    ) -> None:
        self.room_id = room_id
        self.state = state
        self.position_seconds = position_seconds
        self.speed = speed
        self.host_id = host_id
        self.updated_at = updated_at or datetime.now(UTC)

    def current_position(self) -> float:
        """Calculate the current playback position based on elapsed wall-clock time."""
        if self.state != RoomState.PLAYING:
            return self.position_seconds
        elapsed = (datetime.now(UTC) - self.updated_at).total_seconds()
        return self.position_seconds + elapsed * self.speed


class ConnectionInfo:
    """Metadata about a single WebSocket connection."""

    __slots__ = ("ws", "user_id", "joined_at")

    def __init__(self, ws: WebSocket, user_id: str) -> None:
        self.ws = ws
        self.user_id = user_id
        self.joined_at = datetime.now(UTC)


class RoomManager:
    """Singleton that tracks all active room connections and their live state."""

    def __init__(self) -> None:
        # room_id -> list of active connections
        self._connections: dict[str, list[ConnectionInfo]] = {}
        # room_id -> live room state
        self._states: dict[str, RoomStateLive] = {}
        # room_id -> {user_id: username} mapping for MEMBER_UPDATE broadcasts
        self._usernames: dict[str, dict[str, str]] = {}

    # ── Connection lifecycle ───────────────────────────────────────────────────  # noqa: E501

    async def connect(self, room_id: str, user_id: str, ws: WebSocket, username: str = "") -> None:
        await ws.accept()
        if room_id not in self._connections:
            self._connections[room_id] = []
        self._connections[room_id].append(ConnectionInfo(ws, user_id))
        # Track username for this user
        if room_id not in self._usernames:
            self._usernames[room_id] = {}
        if username:
            self._usernames[room_id][user_id] = username
        logger.info(
            "ws_connected", room_id=room_id, user_id=user_id, total=len(self._connections[room_id])
        )

    def disconnect(self, room_id: str, ws: WebSocket) -> None:
        if room_id not in self._connections:
            return
        # Find the user_id being disconnected before removing
        disconnecting_user_id: str | None = None
        for c in self._connections[room_id]:
            if c.ws is ws:
                disconnecting_user_id = c.user_id
                break
        self._connections[room_id] = [c for c in self._connections[room_id] if c.ws is not ws]
        if not self._connections[room_id]:
            del self._connections[room_id]
            # Clean up username map when room empties
            self._usernames.pop(room_id, None)
            logger.info("room_empty", room_id=room_id)
        elif disconnecting_user_id:
            # Only remove username if this user has fully disconnected
            remaining_ids = {c.user_id for c in self._connections[room_id]}
            if disconnecting_user_id not in remaining_ids:
                self._usernames.get(room_id, {}).pop(disconnecting_user_id, None)

    def member_count(self, room_id: str) -> int:
        return len(self._connections.get(room_id, []))

    def connected_user_ids(self, room_id: str) -> list[str]:
        return [c.user_id for c in self._connections.get(room_id, [])]

    def connected_members(self, room_id: str) -> list[dict]:
        """Return list of {id, username} dicts for all connected members."""
        username_map = self._usernames.get(room_id, {})
        seen: set[str] = set()
        result: list[dict] = []
        for c in self._connections.get(room_id, []):
            if c.user_id not in seen:
                seen.add(c.user_id)
                result.append(
                    {
                        "id": c.user_id,
                        "username": username_map.get(c.user_id, ""),
                    }
                )
        return result

    # ── State management ──────────────────────────────────────────────────────  # noqa: E501

    def set_state(self, state: RoomStateLive) -> None:
        self._states[state.room_id] = state

    def get_state(self, room_id: str) -> RoomStateLive | None:
        return self._states.get(room_id)

    def seed_from_db(self, room: Room) -> RoomStateLive:
        """Seed in-memory state from a DB Room row (on first connection or restart)."""
        live = RoomStateLive(
            room_id=str(room.id),
            state=room.state,
            position_seconds=room.position_seconds,
            speed=room.speed,
            host_id=str(room.creator_id),
            updated_at=room.updated_at,
        )
        self._states[str(room.id)] = live
        return live

    # ── Broadcasting ──────────────────────────────────────────────────────────  # noqa: E501

    async def broadcast(self, room_id: str, message: dict) -> None:
        """Send a JSON message to all clients in a room."""
        conns = self._connections.get(room_id, [])
        dead: list[WebSocket] = []
        for conn in conns:
            try:
                await conn.ws.send_json(message)
            except Exception:
                dead.append(conn.ws)
        # Remove any stale connections
        for ws in dead:
            self.disconnect(room_id, ws)

    async def send_to_user(self, room_id: str, user_id: str, message: dict) -> None:
        """Send a message to a specific user in a room."""
        for conn in self._connections.get(room_id, []):
            if conn.user_id == user_id:
                with contextlib.suppress(Exception):
                    await conn.ws.send_json(message)


# Module-level singleton â€” imported and used across the codebase
room_manager = RoomManager()
