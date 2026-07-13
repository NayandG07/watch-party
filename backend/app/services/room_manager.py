"""
Room Manager — in-memory WebSocket connection registry with DB-persisted state.

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

import asyncio
import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING

import structlog
from fastapi import WebSocket

from app.models.enums import RoomState

if TYPE_CHECKING:
    from app.models.room import Room

logger = structlog.get_logger()


class RoomState_Live:
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
        self.updated_at = updated_at or datetime.now(timezone.utc)

    def current_position(self) -> float:
        """Calculate the current playback position based on elapsed wall-clock time."""
        if self.state != RoomState.PLAYING:
            return self.position_seconds
        elapsed = (datetime.now(timezone.utc) - self.updated_at).total_seconds()
        return self.position_seconds + elapsed * self.speed


class ConnectionInfo:
    """Metadata about a single WebSocket connection."""

    __slots__ = ("ws", "user_id", "joined_at")

    def __init__(self, ws: WebSocket, user_id: str) -> None:
        self.ws = ws
        self.user_id = user_id
        self.joined_at = datetime.now(timezone.utc)


class RoomManager:
    """Singleton that tracks all active room connections and their live state."""

    def __init__(self) -> None:
        # room_id -> list of active connections
        self._connections: dict[str, list[ConnectionInfo]] = {}
        # room_id -> live room state
        self._states: dict[str, RoomState_Live] = {}

    # ── Connection lifecycle ───────────────────────────────────────────────────

    async def connect(self, room_id: str, user_id: str, ws: WebSocket) -> None:
        await ws.accept()
        if room_id not in self._connections:
            self._connections[room_id] = []
        self._connections[room_id].append(ConnectionInfo(ws, user_id))
        logger.info("ws_connected", room_id=room_id, user_id=user_id,
                    total=len(self._connections[room_id]))

    def disconnect(self, room_id: str, ws: WebSocket) -> None:
        if room_id not in self._connections:
            return
        self._connections[room_id] = [
            c for c in self._connections[room_id] if c.ws is not ws
        ]
        if not self._connections[room_id]:
            del self._connections[room_id]
            logger.info("room_empty", room_id=room_id)

    def member_count(self, room_id: str) -> int:
        return len(self._connections.get(room_id, []))

    def connected_user_ids(self, room_id: str) -> list[str]:
        return [c.user_id for c in self._connections.get(room_id, [])]

    # ── State management ──────────────────────────────────────────────────────

    def set_state(self, state: RoomState_Live) -> None:
        self._states[state.room_id] = state

    def get_state(self, room_id: str) -> RoomState_Live | None:
        return self._states.get(room_id)

    def seed_from_db(self, room: "Room") -> RoomState_Live:
        """Seed in-memory state from a DB Room row (on first connection or restart)."""
        live = RoomState_Live(
            room_id=str(room.id),
            state=room.state,
            position_seconds=room.position_seconds,
            speed=room.speed,
            host_id=str(room.creator_id),
            updated_at=room.updated_at,
        )
        self._states[str(room.id)] = live
        return live

    # ── Broadcasting ──────────────────────────────────────────────────────────

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
                try:
                    await conn.ws.send_json(message)
                except Exception:
                    pass


# Module-level singleton — imported and used across the codebase
room_manager = RoomManager()
