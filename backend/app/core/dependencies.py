"""
FastAPI dependency injection utilities.

Provides reusable Depends() callables and Annotated type aliases
to keep router signatures clean and consistent.

Usage in routers:
    @router.get("/example")
    async def example(
        db: DatabaseDep,
        current_user_id: CurrentUserIdDep,
    ) -> ...:
        ...
"""

from __future__ import annotations

from typing import Annotated

import structlog
from fastapi import Cookie, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.core.security import decode_token
from app.db.session import get_db

logger = structlog.get_logger()

# HTTPBearer doesn't auto-error so we can also accept cookie-based auth
_bearer_scheme = HTTPBearer(auto_error=False)


# ── Auth ──────────────────────────────────────────────────────────────────────

async def get_current_user_id(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None,
        Depends(_bearer_scheme),
    ] = None,
    access_token: Annotated[str | None, Cookie()] = None,
) -> str:
    """Extract and validate the current user's ID from a JWT.

    Accepts tokens from two sources (in order of preference):
    1. ``Authorization: Bearer <token>`` header
    2. ``access_token`` httpOnly cookie

    Raises:
        HTTPException 401: If no token is present or it is invalid/expired.

    Returns:
        The ``sub`` claim from the token (user UUID as string).
    """
    token: str | None = None

    if credentials is not None:
        token = credentials.credentials
    elif access_token is not None:
        token = access_token

    if token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = decode_token(token)
    except JWTError as exc:
        logger.debug("token_validation_failed", error=str(exc))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
        )

    user_id: str | None = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token is missing subject claim",
        )

    return user_id


async def get_current_user_role(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None,
        Depends(_bearer_scheme),
    ] = None,
    access_token: Annotated[str | None, Cookie()] = None,
) -> tuple[str, str]:
    """Return ``(user_id, role)`` from the access token.

    Embedding the role in the JWT avoids a DB lookup on every request.
    Role changes take effect at next login (or token refresh).

    Returns:
        Tuple of (user_id: str, role: str).
    """
    token: str | None = None
    if credentials is not None:
        token = credentials.credentials
    elif access_token is not None:
        token = access_token

    if token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = decode_token(token)
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    if payload.get("type") != "access":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")

    user_id: str | None = payload.get("sub")
    role: str = payload.get("role", "level1")

    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    return user_id, role


# ── Role guards ───────────────────────────────────────────────────────────────

class RequireRole:
    """Dependency factory that enforces a minimum role level.

    Example::
        @router.post("/libraries")
        async def create_library(
            _: Annotated[None, Depends(RequireRole("level2"))],
            ...
        ): ...
    """

    _ROLE_LEVELS = {"level1": 1, "level2": 2, "super_admin": 99}

    def __init__(self, minimum_role: str) -> None:
        self.minimum_level = self._ROLE_LEVELS.get(minimum_role, 0)

    async def __call__(
        self,
        user_role_pair: Annotated[tuple[str, str], Depends(get_current_user_role)],
    ) -> tuple[str, str]:
        user_id, role = user_role_pair
        actual_level = self._ROLE_LEVELS.get(role, 0)
        if actual_level < self.minimum_level:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action",
            )
        return user_id, role


# ── Annotated type aliases (keep router signatures clean) ─────────────────────

DatabaseDep = Annotated[AsyncSession, Depends(get_db)]
SettingsDep = Annotated[Settings, Depends(get_settings)]
CurrentUserIdDep = Annotated[str, Depends(get_current_user_id)]
CurrentUserRoleDep = Annotated[tuple[str, str], Depends(get_current_user_role)]
RequireLevel2Dep = Annotated[tuple[str, str], Depends(RequireRole("level2"))]
RequireAdminDep = Annotated[tuple[str, str], Depends(RequireRole("super_admin"))]
