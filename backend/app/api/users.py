import uuid

import structlog
from fastapi import APIRouter, HTTPException
from sqlalchemy import select

from app.core.dependencies import DatabaseDep, RequireAdminDep
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])
logger = structlog.get_logger()


@router.get("", response_model=list[UserResponse])
async def list_users(
    _: RequireAdminDep,
    db: DatabaseDep,
) -> list[User]:
    stmt = select(User).order_by(User.created_at.desc())
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: uuid.UUID,
    payload: UserUpdate,
    admin: RequireAdminDep,
    db: DatabaseDep,
) -> UserResponse:
    # Fetch the user explicitly via select() — db.get() can behave unexpectedly
    # with PgBouncer transaction-mode pooling
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    update_data = payload.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=422, detail="No fields to update")

    logger.info(
        "admin_updating_user",
        admin_id=admin[0],
        target_user_id=str(user_id),
        fields=list(update_data.keys()),
    )

    for key, value in update_data.items():
        setattr(user, key, value)

    await db.commit()
    await db.refresh(user)

    logger.info("admin_updated_user", target_user_id=str(user_id), new_role=user.role)
    return UserResponse.model_validate(user)


@router.delete("/{user_id}", status_code=204)
async def delete_user(
    user_id: uuid.UUID,
    admin: RequireAdminDep,
    db: DatabaseDep,
) -> None:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.id == uuid.UUID(admin[0]):
        raise HTTPException(status_code=400, detail="Cannot delete your own account")

    logger.info("admin_deleting_user", admin_id=admin[0], target_user_id=str(user_id))
    
    await db.delete(user)
    await db.commit()
