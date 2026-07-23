"""
Watch Party — FastAPI application factory.

Architecture:
  Frontend → FastAPI → Supabase PostgreSQL
                    → Backblaze B2 (signed URL generation only)
                    → WebSocket sync engine (in-memory + DB-backed)

The backend NEVER proxies video. All media flows:
  Backblaze B2 → Cloudflare CDN → Client
"""

from __future__ import annotations

from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, collections, health, invites, libraries, movies, permissions, rooms, storage_providers, users
from app.core.config import get_settings
from app.core.exceptions import WatchPartyError, watchparty_exception_handler, unhandled_exception_handler
from app.core.log_config import configure_logging

settings = get_settings()


import asyncio
from app.api.rooms import cleanup_inactive_rooms

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:  # noqa: ARG001
    """Application lifespan: startup → serve → shutdown."""
    # Startup
    configure_logging(log_level=settings.log_level, log_format=settings.log_format)
    logger = structlog.get_logger()
    logger.info(
        "watchparty_starting",
        app=settings.app_name,
        version=settings.app_version,
        environment=settings.environment,
    )

    cleanup_task = asyncio.create_task(cleanup_inactive_rooms())

    yield

    # Shutdown
    cleanup_task.cancel()
    logger.info("watchparty_stopping")


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description=(
            "Private synchronized watch-party platform. "
            "Backend coordinates playback; clients stream directly from Cloudflare CDN."
        ),
        # Disable docs in production
        docs_url="/api/docs" if not settings.is_production else None,
        redoc_url="/api/redoc" if not settings.is_production else None,
        openapi_url="/api/openapi.json" if not settings.is_production else None,
        lifespan=lifespan,
    )

    # ── Middleware ────────────────────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Exception handlers ────────────────────────────────────────────────────
    app.add_exception_handler(WatchPartyError, watchparty_exception_handler)  # type: ignore[arg-type]
    app.add_exception_handler(Exception, unhandled_exception_handler)

    # ── Routers ───────────────────────────────────────────────────────────────
    # Phase 1: Health only.
    # Subsequent phases add: auth, users, libraries, collections, movies,
    # rooms, sync (WebSocket), chat, storage.
    app.include_router(health.router)
    
    # Phase 3: Auth & Users
    app.include_router(auth.router, prefix="/api")
    app.include_router(invites.router, prefix="/api")
    app.include_router(users.router, prefix="/api")

    # Phase 4: Library, Collections & Movies
    app.include_router(libraries.router, prefix="/api")
    app.include_router(collections.router, prefix="/api")
    app.include_router(movies.router, prefix="/api")

    # Phase 7: Rooms & Sync
    app.include_router(rooms.router, prefix="/api")

    # Phase 8: Permissions
    app.include_router(permissions.router, prefix="/api")

    # Storage Providers
    app.include_router(storage_providers.router, prefix="/api")

    return app


app = create_app()
