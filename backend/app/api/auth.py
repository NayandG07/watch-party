from __future__ import annotations

import structlog
from fastapi import APIRouter, HTTPException
from sqlalchemy import select

from app.core.dependencies import CurrentUserIdDep, DatabaseDep
from app.models.user import User
from app.schemas.user import UserResponse

logger = structlog.get_logger()
router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me", response_model=UserResponse)
async def get_current_user(
    current_user_id: CurrentUserIdDep,
    db: DatabaseDep,
) -> UserResponse:
    """Return the authenticated user's profile.

    Authentication is handled entirely by Supabase Auth.
    The frontend sends the Supabase-issued JWT; the backend validates it
    using SUPABASE_JWT_SECRET and looks up the user's app-specific profile
    (role, username, etc.) from the public users table.
    """
    user = await db.get(User, current_user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse.model_validate(user)


@router.get("/users", response_model=list[UserResponse])
async def list_users(
    current_user_id: CurrentUserIdDep,
    db: DatabaseDep,
) -> list[UserResponse]:
    """Return all users. For admin use only — role check via RLS or app logic."""
    stmt = select(User).order_by(User.created_at)
    result = await db.execute(stmt)
    users = result.scalars().all()
    return [UserResponse.model_validate(u) for u in users]