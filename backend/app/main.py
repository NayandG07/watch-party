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

import asyncio
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import (
    auth,
    collections,
    health,
    invites,
    libraries,
    movies,
    permissions,
    rooms,
    storage_providers,
    users,
)
from app.api.rooms import cleanup_inactive_rooms
from app.core.config import get_settings
from app.core.exceptions import (
    WatchPartyError,
    unhandled_exception_handler,
    watchparty_exception_handler,
)
from app.core.log_config import configure_logging

settings = get_settings()


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

    # Configure CORS on all registered B2 buckets so browsers can fetch
    # presigned URLs directly (avoiding backend bandwidth proxy entirely).
    asyncio.create_task(_configure_b2_cors_all_buckets(logger))

    yield

    # Shutdown
    cleanup_task.cancel()
    logger.info("watchparty_stopping")


async def _configure_b2_cors_all_buckets(logger: structlog.BoundLogger) -> None:
    """Set permissive CORS rules on every active storage provider bucket.

    This runs once at startup in the background. It is idempotent — calling
    put_bucket_cors repeatedly simply overwrites the previous rules with the
    same values, so restarts are safe.
    """
    import json

    import boto3
    from botocore.client import Config
    from sqlalchemy import select

    from app.core.security import decrypt_secret
    from app.core.storage_utils import extract_s3_creds
    from app.db.session import AsyncSessionLocal
    from app.models.storage_provider import StorageProvider

    # Origins that are allowed to make cross-origin requests to B2.
    # Includes production frontend, localhost dev, and any future domains.
    allowed_origins = [
        "https://binge2gether.netlify.app",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
    ]

    cors_config = {
        "CORSRules": [
            {
                "AllowedHeaders": ["*"],
                "AllowedMethods": ["GET", "HEAD"],
                "AllowedOrigins": allowed_origins,
                "ExposeHeaders": ["Content-Length", "Content-Type", "ETag"],
                "MaxAgeSeconds": 86400,
            }
        ]
    }

    try:
        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(StorageProvider).where(StorageProvider.is_active.is_(True))
            )
            providers = result.scalars().all()

        for sp in providers:
            try:
                creds = json.loads(decrypt_secret(sp.credentials_encrypted))
                access_key_id, secret_access_key = extract_s3_creds(sp.provider_type, creds)
                s3 = boto3.client(
                    "s3",
                    endpoint_url=sp.endpoint_url,
                    aws_access_key_id=access_key_id,
                    aws_secret_access_key=secret_access_key,
                    config=Config(signature_version="s3v4"),
                )
                s3.put_bucket_cors(Bucket=sp.bucket_name, CORSConfiguration=cors_config)
                logger.info(
                    "b2_cors_configured",
                    bucket=sp.bucket_name,
                    provider_type=sp.provider_type,
                    origins=len(allowed_origins),
                )
            except Exception as exc:
                # Non-fatal — log and continue. Worst case: CORS was already set.
                logger.warning("b2_cors_configure_failed", bucket=sp.bucket_name, error=str(exc))

    except Exception as exc:
        logger.warning("b2_cors_startup_failed", error=str(exc))




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
        expose_headers=["*"],
        max_age=3600,
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
