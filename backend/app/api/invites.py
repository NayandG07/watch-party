from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import selectinload

from app.core.config import Settings, get_settings
from app.core.dependencies import DatabaseDep, RequireAdminDep
from app.core.security import create_invite_token
from app.models.invite import Invite
from app.schemas.invite import InviteCreate, InviteResponse

router = APIRouter(prefix="/invites", tags=["invites"])


@router.post("", response_model=InviteResponse, status_code=status.HTTP_201_CREATED)
async def create_invite(
    payload: InviteCreate,
    admin_info: RequireAdminDep,
    db: DatabaseDep,
    settings: Annotated[Settings, Depends(get_settings)],
) -> dict:
    admin_id, _ = admin_info

    # Create the JWT invite token
    token = create_invite_token(
        invited_by=admin_id,
        expires_in_hours=payload.expires_in_hours,
        room_id=str(payload.room_id) if payload.room_id else None,
    )
    
    expires_at = datetime.now(timezone.utc) + timedelta(hours=payload.expires_in_hours)

    invite = Invite(
        token=token,
        invited_by_id=admin_id,
        room_id=payload.room_id,
        expires_at=expires_at,
        max_uses=payload.max_uses,
    )
    
    db.add(invite)
    await db.commit()
    
    # Reload with inviter for the response
    await db.refresh(invite, ["inviter"])

    if payload.room_id:
        invite_url = f"{settings.frontend_url}/rooms/{payload.room_id}?invite={token}"
    else:
        invite_url = f"{settings.frontend_url}/register?token={token}"

    # Return a dict matching InviteResponse schema
    return {
        "id": invite.id,
        "token": invite.token,
        "invite_url": invite_url,
        "room_id": invite.room_id,
        "inviter": invite.inviter,
        "expires_at": invite.expires_at,
        "max_uses": invite.max_uses,
        "use_count": invite.use_count,
        "is_revoked": invite.is_revoked,
        "created_at": invite.created_at,
    }


@router.get("", response_model=list[InviteResponse])
async def list_invites(
    admin_info: RequireAdminDep,
    db: DatabaseDep,
    settings: Annotated[Settings, Depends(get_settings)],
) -> list[dict]:
    from sqlalchemy import select
    
    stmt = select(Invite).options(selectinload(Invite.inviter)).order_by(Invite.created_at.desc())
    result = await db.execute(stmt)
    invites = result.scalars().all()
    
    response = []
    for invite in invites:
        if invite.room_id:
            invite_url = f"{settings.frontend_url}/rooms/{invite.room_id}?invite={invite.token}"
        else:
            invite_url = f"{settings.frontend_url}/register?token={invite.token}"
            
        response.append({
            "id": invite.id,
            "token": invite.token,
            "invite_url": invite_url,
            "room_id": invite.room_id,
            "inviter": invite.inviter,
            "expires_at": invite.expires_at,
            "max_uses": invite.max_uses,
            "use_count": invite.use_count,
            "is_revoked": invite.is_revoked,
            "is_valid": invite.is_valid,
            "created_at": invite.created_at,
        })
        
    return response
