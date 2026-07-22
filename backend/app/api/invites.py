import uuid as _uuid
from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.config import Settings, get_settings
from app.core.dependencies import CurrentUserIdDep, DatabaseDep, RequireAdminDep
from app.core.security import create_invite_token
from app.models.invite import Invite
from app.models.room import Room
from app.models.room_member import RoomMember
from app.models.user import User
from app.schemas.invite import InviteCreate, InviteResponse
from app.schemas.user import UserBrief

router = APIRouter(prefix="/invites", tags=["invites"])


def _build_invite_response(invite: Invite, settings: Settings) -> dict:
    """Build a dict matching InviteResponse from an ORM Invite with loaded inviter."""
    if invite.room_id:
        invite_url = f"{settings.frontend_url}/room/{invite.room_id}?invite={invite.token}"
    else:
        invite_url = f"{settings.frontend_url}/register?token={invite.token}"

    inviter_user = invite.inviter
    inviter_brief = UserBrief(
        id=inviter_user.id,
        username=inviter_user.username,
        role=inviter_user.role,
    )

    return {
        "id": invite.id,
        "token": invite.token,
        "invite_url": invite_url,
        "room_id": invite.room_id,
        "inviter": inviter_brief.model_dump(),
        "expires_at": invite.expires_at,
        "max_uses": invite.max_uses,
        "use_count": invite.use_count,
        "is_revoked": invite.is_revoked,
        "is_valid": invite.is_valid,
        "created_at": invite.created_at,
    }


@router.post("", response_model=InviteResponse, status_code=status.HTTP_201_CREATED)
async def create_invite(
    payload: InviteCreate,
    current_user_id: CurrentUserIdDep,
    db: DatabaseDep,
    settings: Annotated[Settings, Depends(get_settings)],
) -> dict:
    """Create an invite link.

    - If ``room_id`` is provided, the caller must be a member or creator of
      that room. Any authenticated user can invite others to their own room.
    - If ``room_id`` is *not* provided (platform-wide registration invite), the
      caller must be a super_admin.
    """
    if payload.room_id:
        # Verify the room exists and the caller is a member/creator
        room = await db.get(Room, payload.room_id)
        if not room:
            raise HTTPException(status_code=404, detail="Room not found")

        is_creator = str(room.creator_id) == current_user_id
        if not is_creator:
            is_member = await db.scalar(
                select(RoomMember).where(
                    RoomMember.room_id == payload.room_id,
                    RoomMember.user_id == _uuid.UUID(current_user_id),
                )
            )
            if not is_member:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You must be a member of the room to invite others",
                )
    else:
        # Platform invite — require super_admin
        user = await db.get(User, _uuid.UUID(current_user_id))
        if not user or user.role != "super_admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only admins can create platform invites",
            )

    # Create the JWT invite token
    token = create_invite_token(
        invited_by=current_user_id,
        expires_in_hours=payload.expires_in_hours,
        room_id=str(payload.room_id) if payload.room_id else None,
    )

    expires_at = datetime.now(timezone.utc) + timedelta(hours=payload.expires_in_hours)

    invite = Invite(
        token=token,
        invited_by_id=_uuid.UUID(current_user_id),
        room_id=payload.room_id,
        expires_at=expires_at,
        max_uses=payload.max_uses,
    )

    db.add(invite)
    await db.commit()

    # Reload with inviter relationship populated
    await db.refresh(invite)
    result = await db.execute(
        select(Invite)
        .where(Invite.id == invite.id)
        .options(selectinload(Invite.inviter))
    )
    invite = result.scalar_one()

    return _build_invite_response(invite, settings)


@router.get("", response_model=list[InviteResponse])
async def list_invites(
    admin_info: RequireAdminDep,
    db: DatabaseDep,
    settings: Annotated[Settings, Depends(get_settings)],
) -> list[dict]:
    stmt = (
        select(Invite)
        .options(selectinload(Invite.inviter))
        .order_by(Invite.created_at.desc())
    )
    result = await db.execute(stmt)
    invites = result.scalars().all()
    return [_build_invite_response(inv, settings) for inv in invites]
