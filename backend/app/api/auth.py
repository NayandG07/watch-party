from __future__ import annotations

import random
import secrets
from datetime import UTC, datetime, timedelta
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
from app.utils.disposable_domains import is_disposable_email
from app.utils.email import send_otp_email

logger = structlog.get_logger()
router = APIRouter(prefix="/auth", tags=["auth"])

OTP_EXPIRE_MINUTES = 10


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


def _generate_otp() -> str:
    """Generate a cryptographically secure 6-digit OTP."""
    return f"{secrets.randbelow(900000) + 100000:06d}"


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

    if not user.is_email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="EMAIL_NOT_VERIFIED",
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
    except Exception as err:
        _clear_refresh_cookie(response, settings)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token"
        ) from err

    user = await db.get(User, user_id)
    if not user or not user.is_active:
        _clear_refresh_cookie(response, settings)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="User inactive or deleted"
        )

    access_token = create_access_token(subject=str(user.id), role=user.role.value)
    new_refresh_token = create_refresh_token(subject=str(user.id))

    _set_refresh_cookie(response, new_refresh_token, settings)

    return TokenRefreshResponse(access_token=access_token)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    response: Response,
    settings: Annotated[Settings, Depends(get_settings)],
) -> None:
    _clear_refresh_cookie(response, settings)


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(
    payload: UserRegister,
    db: DatabaseDep,
    response: Response,
    settings: Annotated[Settings, Depends(get_settings)],
) -> dict:
    """Register a new user (invite required) and send OTP for email verification."""
    invite: Invite | None = None

    # 1. Block disposable email domains
    if is_disposable_email(payload.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Disposable email addresses are not allowed. Please use a permanent email.",
        )

    # 2. Validate Invite Token (optional)
    if payload.invite_token:
        stmt = select(Invite).where(Invite.token == payload.invite_token)
        result = await db.execute(stmt)
        invite = result.scalar_one_or_none()

        if not invite or not invite.is_valid or invite.room_id is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid, expired, or room-specific invite token",
            )

    # 3. Check if username/email exists
    stmt = select(User).where((User.username == payload.username) | (User.email == payload.email))
    result = await db.execute(stmt)
    if result.first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email is already taken",
        )

    # 4. Generate OTP
    otp = _generate_otp()
    otp_hash = hash_password(otp)
    otp_expires_at = datetime.now(UTC) + timedelta(minutes=OTP_EXPIRE_MINUTES)

    # 5. Create User (unverified)
    new_user = User(
        username=payload.username,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        is_active=True,
        is_email_verified=False,
        email_otp_hash=otp_hash,
        email_otp_expires_at=otp_expires_at,
    )
    db.add(new_user)

    # 6. Update Invite usage
    if invite:
        invite.use_count += 1
        if invite.use_count >= invite.max_uses:
            invite.is_revoked = True

    await db.commit()
    await db.refresh(new_user)

    # 7. Send OTP email (fire and forget — don't fail registration on email error)
    await send_otp_email(payload.email, otp, settings)

    return {
        "message": "Account created. Please check your email for the 6-digit verification code.",
        "email": payload.email,
        "requires_verification": True,
    }


@router.post("/verify-email", status_code=status.HTTP_200_OK)
async def verify_email(
    payload: dict,
    db: DatabaseDep,
    response: Response,
    settings: Annotated[Settings, Depends(get_settings)],
) -> LoginResponse:
    """Verify a user's email with their OTP code and return an access token."""
    email: str = payload.get("email", "").strip().lower()
    otp: str = payload.get("otp", "").strip()

    if not email or not otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email and OTP code are required.",
        )

    stmt = select(User).where(User.email == email)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found with that email.",
        )

    if user.is_email_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already verified. Please log in.",
        )

    # Check OTP expiry
    if not user.email_otp_expires_at or datetime.now(UTC) > user.email_otp_expires_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code has expired. Please request a new one.",
        )

    # Verify OTP hash
    if not user.email_otp_hash or not verify_password(otp, user.email_otp_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code.",
        )

    # Mark verified and clear OTP
    user.is_email_verified = True
    user.email_otp_hash = None
    user.email_otp_expires_at = None
    await db.commit()
    await db.refresh(user)

    # Issue tokens
    access_token = create_access_token(subject=str(user.id), role=user.role.value)
    refresh_token_val = create_refresh_token(subject=str(user.id))
    _set_refresh_cookie(response, refresh_token_val, settings)

    return LoginResponse(
        access_token=access_token,
        user=UserBrief.model_validate(user),
    )


@router.post("/resend-verification", status_code=status.HTTP_200_OK)
async def resend_verification(
    payload: dict,
    db: DatabaseDep,
    settings: Annotated[Settings, Depends(get_settings)],
) -> dict:
    """Resend the OTP verification email to an unverified user."""
    email: str = payload.get("email", "").strip().lower()
    if not email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email is required.")

    stmt = select(User).where(User.email == email)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    # Don't leak whether the email exists — always return the same message
    if not user or user.is_email_verified:
        return {"message": "If that email matches an unverified account, a new code has been sent."}

    otp = _generate_otp()
    user.email_otp_hash = hash_password(otp)
    user.email_otp_expires_at = datetime.now(UTC) + timedelta(minutes=OTP_EXPIRE_MINUTES)
    await db.commit()

    await send_otp_email(email, otp, settings)

    return {"message": "A new verification code has been sent to your email."}


@router.get("/me", response_model=UserResponse)
async def get_current_user(
    current_user_id: CurrentUserIdDep,
    db: DatabaseDep,
) -> UserResponse:
    user = await db.get(User, current_user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse.model_validate(user)