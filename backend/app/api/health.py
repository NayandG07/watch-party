"""
Health check endpoints.

GET /api/health — Returns application status, version, environment,
                  and a live database connectivity check.

This endpoint is intentionally unauthenticated so load balancers,
Docker healthchecks, and uptime monitors can reach it.
"""

from __future__ import annotations

import structlog
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.db.session import get_db

router = APIRouter()
logger = structlog.get_logger()
settings = get_settings()


class HealthResponse(BaseModel):
    status: str
    version: str
    environment: str
    database: str


@router.get(
    "/api/health",
    response_model=HealthResponse,
    tags=["Health"],
    summary="Application health check",
    description=(
        "Returns the current application status. "
        "The `database` field reflects live connectivity to Supabase PostgreSQL."
    ),
)
async def health_check(db: AsyncSession = Depends(get_db)) -> HealthResponse:
    """Perform a live health check including database connectivity."""
    db_status = "ok"
    try:
        await db.execute(text("SELECT 1"))
    except Exception as exc:
        logger.warning("health_check_db_failed", error=str(exc))
        db_status = "error"

    return HealthResponse(
        status="ok",
        version=settings.app_version,
        environment=settings.environment,
        database=db_status,
    )
