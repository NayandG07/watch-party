"""
Room API & WebSocket endpoint.

HTTP endpoints:
  POST /api/rooms              — Create a new watch room
  GET  /api/rooms/{id}         — Fetch room metadata + current state

WebSocket:
  WS  /api/rooms/{id}/ws?token=<ws_token>

WS Message Protocol (client → server):
  { "type": "PLAY",  "position": 120.5 }
  { "type": "PAUSE", "position": 120.5 }
  { "type": "SEEK",  "position": 305.2 }
  { "type": "PING" }  — keep-alive

WS Message Protocol (server → client):
  { "type": "ROOM_STATE",
    "state": "playing",
    "position": 125.3,
    "speed": 1.0,
    "host_id": "<uuid>",
    "member_count": 2,
    "server_time": 1720000000.0 }  — server UTC timestamp for drift calc
  { "type": "PONG" }
  { "type": "ERROR", "detail": "..." }
  { "type": "MEMBER_UPDATE", "count": 3 }
"""

from __future__ import annotations

import secrets
import uuid
from datetime import datetime, timezone

import structlog
from fastapi import APIRouter, HTTPException, Query, WebSocket, WebSocketDisconnect, status
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.dependencies import CurrentUserIdDep, DatabaseDep
from app.core.security import create_ws_token, decode_ws_token
from app.models.enums import RoomState
from app.models.room import Room
from app.models.room_member import RoomMember
from app.schemas.room import RoomCreate, RoomResponse, WSTokenResponse
from app.services.room_manager import RoomState_Live, room_manager

logger = structlog.get_logger()
router = APIRouter(prefix="/rooms", tags=["rooms"])


# ── HTTP Endpoints ────────────────────────────────────────────────────────────

@router.post("", response_model=RoomResponse, status_code=status.HTTP_201_CREATED)
async def create_room(
    payload: RoomCreate,
    current_user_id: CurrentUserIdDep,
    db: DatabaseDep,
) -> Room:
    slug = secrets.token_urlsafe(8)

    new_room = Room(
        name=payload.name,
        slug=slug,
        movie_id=payload.movie_id,
        creator_id=uuid.UUID(current_user_id),
        state=RoomState.WAITING,
        position_seconds=0.0,
        speed=1.0,
    )
    db.add(new_room)

    # Creator becomes first member (host)
    await db.flush()
    member = RoomMember(room_id=new_room.id, user_id=uuid.UUID(current_user_id), is_host=True)
    db.add(member)

    await db.commit()

    stmt = (
        select(Room)
        .where(Room.id == new_room.id)
        .options(selectinload(Room.creator), selectinload(Room.movie))
    )
    result = await db.execute(stmt)
    return result.scalar_one()


@router.get("/{room_id}", response_model=RoomResponse)
async def get_room(
    room_id: uuid.UUID,
    current_user_id: CurrentUserIdDep,
    db: DatabaseDep,
) -> Room:
    stmt = (
        select(Room)
        .where(Room.id == room_id)
        .options(selectinload(Room.creator), selectinload(Room.movie))
    )
    result = await db.execute(stmt)
    room = result.scalar_one_or_none()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return room


@router.get("/{room_id}/ws-token", response_model=WSTokenResponse)
async def get_ws_token(
    room_id: uuid.UUID,
    current_user_id: CurrentUserIdDep,
    db: DatabaseDep,
) -> WSTokenResponse:
    """Issue a 60-second one-time token to authenticate the WS upgrade."""
    room = await db.get(Room, room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    token = create_ws_token(user_id=current_user_id, room_id=str(room_id))
    return WSTokenResponse(ws_token=token)


# ── WebSocket ─────────────────────────────────────────────────────────────────

@router.websocket("/{room_id}/ws")
async def room_websocket(
    room_id: uuid.UUID,
    ws: WebSocket,
    db: DatabaseDep,
    token: str = Query(..., description="Short-lived WS auth token"),
) -> None:
    """WebSocket endpoint for room synchronization."""

    # 1. Authenticate the WS upgrade
    try:
        claims = decode_ws_token(token)
        user_id: str = claims["sub"]
        claimed_room = claims.get("room_id")
        if claimed_room != str(room_id):
            await ws.close(code=4003, reason="Token room mismatch")
            return
    except JWTError as exc:
        await ws.close(code=4001, reason="Invalid or expired token")
        logger.warning("ws_auth_failed", error=str(exc))
        return

    # 2. Load room from DB (or seed from existing in-memory state)
    room = await db.get(Room, room_id)
    if not room:
        await ws.close(code=4004, reason="Room not found")
        return

    if room.is_locked and str(room.creator_id) != user_id:
        await ws.close(code=4003, reason="Room is locked")
        return

    # 3. Establish live state (seed from DB if this is the first connection)
    live = room_manager.get_state(str(room_id))
    if live is None:
        live = room_manager.seed_from_db(room)

    # 4. Accept the connection
    await room_manager.connect(str(room_id), user_id, ws)
    is_host = (str(room.creator_id) == user_id)

    # 5. Send initial state to the newly connected client
    await ws.send_json(_make_state_msg(live, room_manager.member_count(str(room_id))))

    # Notify everyone of new member
    await room_manager.broadcast(str(room_id), {
        "type": "MEMBER_UPDATE",
        "count": room_manager.member_count(str(room_id)),
        "user_ids": room_manager.connected_user_ids(str(room_id)),
    })

    # 6. Message loop
    try:
        while True:
            data = await ws.receive_json()
            msg_type: str = data.get("type", "")

            if msg_type == "PING":
                await ws.send_json({"type": "PONG"})
                continue

            # Only the host can control playback
            if not is_host:
                if msg_type in ("PLAY", "PAUSE", "SEEK"):
                    await ws.send_json({
                        "type": "ERROR",
                        "detail": "Only the host can control playback",
                    })
                    continue

            if msg_type in ("PLAY", "PAUSE", "SEEK"):
                position = float(data.get("position", live.current_position()))

                if msg_type == "PLAY":
                    new_state = RoomState.PLAYING
                elif msg_type == "PAUSE":
                    new_state = RoomState.PAUSED
                else:
                    # SEEK — preserve current play/pause state
                    new_state = live.state if live.state != RoomState.WAITING else RoomState.PAUSED

                # Update in-memory state
                live = RoomState_Live(
                    room_id=str(room_id),
                    state=new_state,
                    position_seconds=position,
                    speed=live.speed,
                    host_id=str(room.creator_id),
                )
                room_manager.set_state(live)

                # Persist to DB (fire-and-forget via background task)
                room.state = new_state
                room.position_seconds = position
                room.last_activity_at = datetime.now(timezone.utc)
                await db.commit()

                # Broadcast new state to all clients
                await room_manager.broadcast(
                    str(room_id),
                    _make_state_msg(live, room_manager.member_count(str(room_id))),
                )

    except WebSocketDisconnect:
        logger.info("ws_disconnected", room_id=str(room_id), user_id=user_id)
    except Exception as exc:
        logger.error("ws_error", room_id=str(room_id), error=str(exc))
    finally:
        room_manager.disconnect(str(room_id), ws)
        await room_manager.broadcast(str(room_id), {
            "type": "MEMBER_UPDATE",
            "count": room_manager.member_count(str(room_id)),
            "user_ids": room_manager.connected_user_ids(str(room_id)),
        })


def _make_state_msg(live: RoomState_Live, member_count: int) -> dict:
    return {
        "type": "ROOM_STATE",
        "state": live.state.value if hasattr(live.state, "value") else live.state,
        "position": live.current_position(),
        "speed": live.speed,
        "host_id": live.host_id,
        "member_count": member_count,
        "server_time": datetime.now(timezone.utc).timestamp(),
    }
