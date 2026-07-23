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

import asyncio
import secrets
import uuid
from datetime import datetime, timedelta, timezone

import structlog
from fastapi import APIRouter, Depends, HTTPException, Query, status, BackgroundTasks, WebSocket, WebSocketDisconnect
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import selectinload

from app.core.dependencies import CurrentUserIdDep, DatabaseDep
from app.core.security import create_ws_token, decode_ws_token
from app.db.session import AsyncSessionLocal
from app.models.chat_message import ChatMessage
from app.models.enums import MessageType, RoomState
from app.models.room import Room
from app.models.room_member import RoomMember
from app.models.user import User
from app.schemas.room import (
    ChatMessageResponse,
    RoomCreate,
    RoomResponse,
    RoomSetMedia,
    RoomUpdate,
    WSTokenResponse,
)
from pydantic import BaseModel
from app.services.room_manager import RoomState_Live, room_manager

class JoinRoomRequest(BaseModel):
    invite_token: str


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
        external_url=payload.external_url,
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
        
    # Check if user is a member
    is_member = await db.scalar(
        select(RoomMember).where(RoomMember.room_id == room_id, RoomMember.user_id == uuid.UUID(current_user_id))
    )
    if not is_member:
        raise HTTPException(status_code=403, detail="You are not a member of this room")
        
    return room

@router.get("", response_model=list[RoomResponse])
async def list_rooms(
    current_user_id: CurrentUserIdDep,
    db: DatabaseDep,
) -> list[Room]:
    stmt = (
        select(Room)
        .join(RoomMember)
        .where(RoomMember.user_id == uuid.UUID(current_user_id))
        .options(selectinload(Room.creator), selectinload(Room.movie))
        .order_by(Room.created_at.desc())
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())

@router.post("/{room_id}/join")
async def join_room(
    room_id: uuid.UUID,
    payload: JoinRoomRequest,
    current_user_id: CurrentUserIdDep,
    db: DatabaseDep,
) -> dict:
    from app.core.security import decode_invite_token
    from app.models.invite import Invite
    from datetime import datetime, timezone

    room = await db.get(Room, room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    try:
        claims = decode_invite_token(payload.invite_token)
    except JWTError:
        raise HTTPException(status_code=400, detail="Invalid or expired invite token")

    token_room_id = claims.get("room_id")
    if token_room_id and token_room_id != str(room_id):
        raise HTTPException(status_code=400, detail="Invite token is for a different room")

    # Check invite in db
    stmt = select(Invite).where(Invite.token == payload.invite_token)
    result = await db.execute(stmt)
    invite = result.scalar_one_or_none()
    
    if not invite or invite.is_revoked:
        raise HTTPException(status_code=400, detail="Invite is invalid or revoked")
    
    if invite.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Invite has expired")
        
    if invite.use_count >= invite.max_uses:
        raise HTTPException(status_code=400, detail="Invite maximum uses reached")

    # Check if already member
    user_uuid = uuid.UUID(current_user_id)
    is_member = await db.scalar(
        select(RoomMember).where(RoomMember.room_id == room_id, RoomMember.user_id == user_uuid)
    )
    
    if not is_member:
        try:
            member = RoomMember(room_id=room_id, user_id=user_uuid, is_host=False)
            db.add(member)
            invite.use_count += 1
            await db.commit()
        except IntegrityError:
            await db.rollback()

    return {"status": "joined"}


@router.patch("/{room_id}/set-media", response_model=RoomResponse)
async def set_room_media(
    room_id: uuid.UUID,
    payload: RoomSetMedia,
    current_user_id: CurrentUserIdDep,
    db: DatabaseDep,
) -> Room:
    """Host sets or changes the media in a room (library movie or external URL)."""
    stmt = (
        select(Room)
        .where(Room.id == room_id)
        .options(selectinload(Room.creator), selectinload(Room.movie))
    )
    result = await db.execute(stmt)
    room = result.scalar_one_or_none()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    if str(room.creator_id) != current_user_id:
        raise HTTPException(status_code=403, detail="Only host can change media")

    room.movie_id = payload.movie_id
    room.external_url = payload.external_url
    # Reset playback when media changes
    room.position_seconds = 0.0
    room.state = RoomState.WAITING
    from datetime import datetime, timezone
    room.last_activity_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(room, ["creator", "movie"])

    # Broadcast media change to all connected clients
    await room_manager.broadcast(str(room_id), {
        "type": "MEDIA_CHANGE",
        "movie_id": str(payload.movie_id) if payload.movie_id else None,
        "external_url": payload.external_url,
    })
    return room

@router.patch("/{room_id}", response_model=RoomResponse)
async def update_room(
    room_id: uuid.UUID,
    payload: RoomUpdate,
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
        
    if str(room.creator_id) != current_user_id:
        raise HTTPException(status_code=403, detail="Only host can update room")
        
    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(room, key, value)
        
    await db.commit()
    await db.refresh(room)
    return room


@router.delete("/{room_id}", status_code=status.HTTP_200_OK)
async def delete_room(
    room_id: uuid.UUID,
    current_user_id: CurrentUserIdDep,
    db: DatabaseDep,
) -> dict:
    """Delete a room (only creator or super admin)."""
    room = await db.get(Room, room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    user = await db.get(User, uuid.UUID(current_user_id))
    is_admin = user and user.role == "super_admin"

    if str(room.creator_id) != current_user_id and not is_admin:
        raise HTTPException(status_code=403, detail="Only host or admin can delete room")

    # Broadcast deletion to all connected WebSocket clients
    await room_manager.broadcast(str(room_id), {
        "type": "ROOM_DELETED",
        "detail": "This room has been deleted by the host.",
    })

    await db.delete(room)
    await db.commit()
    return {"message": "Room deleted successfully"}


async def cleanup_inactive_rooms() -> None:
    """Background task running every 5 minutes to delete empty rooms inactive for >60 minutes."""
    while True:
        try:
            await asyncio.sleep(300)  # Check every 5 minutes
            cutoff = datetime.now(timezone.utc) - timedelta(minutes=60)
            async with AsyncSessionLocal() as db:
                stmt = select(Room).where(Room.last_activity_at < cutoff)
                result = await db.execute(stmt)
                inactive_rooms = result.scalars().all()

                for r in inactive_rooms:
                    # Delete only if no active WebSocket members connected right now
                    if room_manager.member_count(str(r.id)) == 0:
                        logger.info("cleaning_up_inactive_room", room_id=str(r.id), name=r.name)
                        await db.delete(r)
                await db.commit()
        except asyncio.CancelledError:
            break
        except Exception as exc:
            logger.error("inactive_rooms_cleanup_error", error=str(exc))


@router.get("/{room_id}/chat", response_model=list[ChatMessageResponse])
async def get_room_chat(
    room_id: uuid.UUID,
    current_user_id: CurrentUserIdDep,
    db: DatabaseDep,
) -> list[ChatMessage]:
    """Fetch the latest chat history for a room."""
    room = await db.get(Room, room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    # Ensure user is member
    is_member = await db.scalar(
        select(RoomMember).where(RoomMember.room_id == room_id, RoomMember.user_id == uuid.UUID(current_user_id))
    )
    if not is_member:
        raise HTTPException(status_code=403, detail="You are not a member of this room")

    if room.is_locked and str(room.creator_id) != current_user_id:
        raise HTTPException(status_code=403, detail="Room is locked")

    stmt = (
        select(ChatMessage)
        .where(ChatMessage.room_id == room_id)
        .options(selectinload(ChatMessage.user))
        .order_by(ChatMessage.created_at.asc())
        .limit(100)
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())
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

    is_member = await db.scalar(
        select(RoomMember).where(RoomMember.room_id == room_id, RoomMember.user_id == uuid.UUID(current_user_id))
    )
    if not is_member:
        raise HTTPException(status_code=403, detail="You are not a member of this room")

    token = create_ws_token(user_id=current_user_id, room_id=str(room_id))
    return WSTokenResponse(ws_token=token)


# ── WebSocket ─────────────────────────────────────────────────────────────────

@router.websocket("/{room_id}/ws")
async def room_websocket(
    room_id: uuid.UUID,
    ws: WebSocket,
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

    # 2. Load room from DB (short-lived DB session)
    async with AsyncSessionLocal() as db:
        room = await db.get(Room, room_id)
        if not room:
            await ws.close(code=4004, reason="Room not found")
            return

        if room.is_locked and str(room.creator_id) != user_id:
            await ws.close(code=4003, reason="Room is locked")
            return

        creator_id_str = str(room.creator_id)
        is_room_locked = room.is_locked

        # Seed live state if first connection
        live = room_manager.get_state(str(room_id))
        if live is None:
            live = room_manager.seed_from_db(room)

    # 4. Accept the connection
    await room_manager.connect(str(room_id), user_id, ws)
    is_host = (creator_id_str == user_id)

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

            # If room is locked, only the host can control playback.
            # If unlocked, any room member can control playback.
            if is_room_locked and not is_host:
                if msg_type in ("PLAY", "PAUSE", "SEEK"):
                    await ws.send_json({
                        "type": "ERROR",
                        "detail": "Room is locked by host",
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

                # Update in-memory state — use exact position from client, not computed one
                live = RoomState_Live(
                    room_id=str(room_id),
                    state=new_state,
                    position_seconds=position,
                    speed=live.speed,
                    host_id=creator_id_str,
                )
                room_manager.set_state(live)

                # Persist to DB in a background task so it doesn't block the real-time broadcast
                async def _save_state(r_id, s, p):
                    try:
                        async with AsyncSessionLocal() as db:
                            db_room = await db.get(Room, r_id)
                            if db_room:
                                db_room.state = s
                                db_room.position_seconds = p
                                db_room.last_activity_at = datetime.now(timezone.utc)
                                await db.commit()
                    except Exception as e:
                        logger.error("bg_save_state_error", error=str(e))
                
                asyncio.create_task(_save_state(room_id, new_state, position))

                # Broadcast new state — capture server_time NOW (after DB, before network)
                # so clients can accurately compute their one-way latency.
                # We send `position` directly (the exact value from the host) rather than
                # live.current_position() which would add DB-commit latency to the offset.
                broadcast_msg = {
                    "type": "ROOM_STATE",
                    "state": new_state.value if hasattr(new_state, "value") else new_state,
                    "position": position,
                    "speed": live.speed,
                    "host_id": live.host_id,
                    "member_count": room_manager.member_count(str(room_id)),
                    "server_time": datetime.now(timezone.utc).timestamp(),
                }
                await room_manager.broadcast(str(room_id), broadcast_msg)
                
            elif msg_type == "CHAT_MESSAGE":
                content = data.get("content")
                if not content:
                    continue

                m_type = data.get("message_type", MessageType.TEXT.value)
                try:
                    enum_type = MessageType(m_type)
                except ValueError:
                    enum_type = MessageType.TEXT
                    
                timestamp_ref = data.get("timestamp_reference")

                async with AsyncSessionLocal() as db:
                    new_msg = ChatMessage(
                        room_id=room_id,
                        user_id=uuid.UUID(user_id),
                        content=str(content),
                        message_type=enum_type,
                        timestamp_reference=float(timestamp_ref) if timestamp_ref is not None else None,
                    )
                    db.add(new_msg)
                    await db.commit()
                    
                    # Fetch user for broadcast
                    user = await db.get(User, uuid.UUID(user_id))
                    username = user.username if user else "Unknown"
                    msg_id = str(new_msg.id)
                    created_at_str = new_msg.created_at.isoformat() if new_msg.created_at else datetime.now(timezone.utc).isoformat()
                
                await room_manager.broadcast(
                    str(room_id),
                    {
                        "type": "CHAT_MESSAGE",
                        "id": msg_id,
                        "content": str(content),
                        "message_type": enum_type.value,
                        "timestamp_reference": float(timestamp_ref) if timestamp_ref is not None else None,
                        "created_at": created_at_str,
                        "user": {
                            "id": user_id,
                            "username": username,
                        }
                    }
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


def _make_state_msg(live: RoomState_Live, member_count: int, external_url: str | None = None) -> dict:
    return {
        "type": "ROOM_STATE",
        "state": live.state.value if hasattr(live.state, "value") else live.state,
        "position": live.current_position(),
        "speed": live.speed,
        "host_id": live.host_id,
        "member_count": member_count,
        "server_time": datetime.now(timezone.utc).timestamp(),
        "external_url": external_url,
    }
