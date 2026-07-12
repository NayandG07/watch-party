from typing import Annotated

import structlog
from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status
from sqlalchemy import select

from app.core.config import Settings, get_settings
from app.core.dependencies import CurrentUserIdDep, DatabaseDep
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.invite import Invite
from app.models.user import User
from app.schemas.user import (
    LoginResponse,
    TokenRefreshResponse,
    UserBrief,
    UserLogin,
    UserRegister,
    UserResponse,
)

logger = structlog.get_logger()
router = APIRouter(prefix="/auth", tags=["auth"])


def _set_refresh_cookie(response: Response, token: str, settings: Settings) -> None:
    response.set_cookie(
        key="refresh_token",
        value=token,
        httponly=True,
        secure=not settings.is_development,
        samesite="lax",
        max_age=settings.refresh_token_expire_days * 24 * 60 * 60,
    )


def _clear_refresh_cookie(response: Response, settings: Settings) -> None:
    response.delete_cookie(
        key="refresh_token",
        httponly=True,
        secure=not settings.is_development,
        samesite="lax",
    )


@router.post("/login", response_model=LoginResponse)
async def login(
    payload: UserLogin,
    response: Response,
    db: DatabaseDep,
    settings: Annotated[Settings, Depends(get_settings)],
) -> LoginResponse:
    stmt = select(User).where(User.username == payload.username)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive",
        )

    access_token = create_access_token(subject=str(user.id), role=user.role.value)
    refresh_token = create_refresh_token(subject=str(user.id))

    _set_refresh_cookie(response, refresh_token, settings)

    return LoginResponse(
        access_token=access_token,
        user=UserBrief.model_validate(user),
    )


@router.post("/refresh", response_model=TokenRefreshResponse)
async def refresh_token(
    response: Response,
    db: DatabaseDep,
    settings: Annotated[Settings, Depends(get_settings)],
    refresh_token: Annotated[str | None, Cookie()] = None,
) -> TokenRefreshResponse:
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing refresh token"
        )

    try:
        payload = decode_token(refresh_token)
        if payload.get("type") != "refresh":
            raise ValueError("Invalid token type")
        user_id = payload["sub"]
    except Exception:
        _clear_refresh_cookie(response, settings)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token"
        )

    user = await db.get(User, user_id)
    if not user or not user.is_active:
        _clear_refresh_cookie(response, settings)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="User inactive or deleted"
        )

    access_token = create_access_token(subject=str(user.id), role=user.role.value)
    new_refresh_token = create_refresh_token(subject=str(user.id))

    # Rolling refresh tokens
    _set_refresh_cookie(response, new_refresh_token, settings)

    return TokenRefreshResponse(access_token=access_token)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    response: Response,
    settings: Annotated[Settings, Depends(get_settings)],
) -> None:
    _clear_refresh_cookie(response, settings)


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    payload: UserRegister,
    db: DatabaseDep,
) -> UserResponse:
    # 1. Validate Invite Token
    stmt = select(Invite).where(Invite.token == payload.invite_token)
    result = await db.execute(stmt)
    invite = result.scalar_one_or_none()

    if not invite or not invite.is_valid or invite.room_id is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid, expired, or room-specific invite token",
        )

    # 2. Check if username/email exists
    stmt = select(User).where((User.username == payload.username) | (User.email == payload.email))
    result = await db.execute(stmt)
    if result.first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email is already taken",
        )

    # 3. Create User
    new_user = User(
        username=payload.username,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        is_active=True,
    )
    db.add(new_user)

    # 4. Update Invite
    invite.use_count += 1
    if invite.use_count >= invite.max_uses:
        invite.is_revoked = True

    await db.commit()
    await db.refresh(new_user)
    
    return UserResponse.model_validate(new_user)


@router.get("/me", response_model=UserResponse)
async def get_current_user(
    current_user_id: CurrentUserIdDep,
    db: DatabaseDep,
) -> UserResponse:
    user = await db.get(User, current_user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse.model_validate(user)
