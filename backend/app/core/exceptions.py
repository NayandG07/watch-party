"""
Custom exception hierarchy and FastAPI exception handlers.

Design:
- All domain exceptions inherit from WatchPartyError.
- Handlers convert them to RFC 7807-style JSON responses.
- Unhandled exceptions are caught, logged, and returned as generic 500s
  so stack traces are never leaked to clients.
"""

from __future__ import annotations

import structlog
from fastapi import Request, status
from fastapi.responses import JSONResponse

logger = structlog.get_logger()


# ── Base ──────────────────────────────────────────────────────────────────────

class WatchPartyError(Exception):
    """Root exception for all Watch Party domain errors."""

    status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR
    error_code: str = "internal_error"

    def __init__(self, message: str) -> None:
        self.message = message
        super().__init__(message)


# ── 4xx Client Errors ─────────────────────────────────────────────────────────

class NotFoundError(WatchPartyError):
    """Raised when a requested resource does not exist or is not visible."""

    status_code = status.HTTP_404_NOT_FOUND
    error_code = "not_found"

    def __init__(self, resource: str, identifier: str | int | None = None) -> None:
        if identifier is not None:
            message = f"{resource} '{identifier}' was not found"
        else:
            message = f"{resource} was not found"
        super().__init__(message)


class PermissionDeniedError(WatchPartyError):
    """Raised when the current user lacks permission for an action."""

    status_code = status.HTTP_403_FORBIDDEN
    error_code = "permission_denied"

    def __init__(self, message: str = "You do not have permission to perform this action") -> None:
        super().__init__(message)


class AuthenticationError(WatchPartyError):
    """Raised when authentication fails (bad credentials, expired token, etc.)."""

    status_code = status.HTTP_401_UNAUTHORIZED
    error_code = "authentication_error"

    def __init__(self, message: str = "Authentication failed") -> None:
        super().__init__(message)


class ConflictError(WatchPartyError):
    """Raised when an action would create a conflicting state (e.g. duplicate username)."""

    status_code = status.HTTP_409_CONFLICT
    error_code = "conflict"


class ValidationError(WatchPartyError):
    """Raised for domain-level validation failures (distinct from Pydantic validation)."""

    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    error_code = "validation_error"


class RoomLockedError(WatchPartyError):
    """Raised when a user tries to join a locked room."""

    status_code = status.HTTP_423_LOCKED
    error_code = "room_locked"

    def __init__(self) -> None:
        super().__init__("This room has been locked by the host")


class InviteExpiredError(WatchPartyError):
    """Raised when an invite token is expired, revoked, or exhausted."""

    status_code = status.HTTP_410_GONE
    error_code = "invite_expired"

    def __init__(self) -> None:
        super().__init__("This invite link is no longer valid")


class StorageError(WatchPartyError):
    """Raised for storage provider failures."""

    status_code = status.HTTP_502_BAD_GATEWAY
    error_code = "storage_error"


# ── Exception handlers ────────────────────────────────────────────────────────

async def watchparty_exception_handler(
    request: Request,
    exc: WatchPartyError,
) -> JSONResponse:
    """Convert WatchPartyError subclasses into structured JSON responses."""
    log = logger.bind(
        path=str(request.url.path),
        method=request.method,
        status_code=exc.status_code,
        error_code=exc.error_code,
    )
    if exc.status_code >= 500:
        log.error("server_error", message=exc.message, exc_info=True)
    else:
        log.info("client_error", message=exc.message)

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.error_code,
            "message": exc.message,
        },
    )


async def unhandled_exception_handler(
    request: Request,
    exc: Exception,
) -> JSONResponse:
    """Catch-all handler for unexpected exceptions.

    Logs the full traceback server-side but returns a generic message
    to the client — stack traces must never be exposed.
    """
    logger.error(
        "unhandled_exception",
        path=str(request.url.path),
        method=request.method,
        exc_type=type(exc).__name__,
        exc_info=True,
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "internal_error",
            "message": "An unexpected error occurred. Please try again later.",
        },
    )
