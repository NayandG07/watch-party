"""
Async SQLAlchemy engine and session factory.

The engine connects to Supabase PostgreSQL via the asyncpg driver.
Connection pool is sized conservatively — the platform serves ≤ 8 users.

Usage (inside FastAPI routes via dependency injection):
    async def my_route(db: DatabaseDep) -> ...:
        result = await db.execute(select(User))
"""

from __future__ import annotations

from collections.abc import AsyncGenerator

import structlog
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import get_settings

logger = structlog.get_logger()
settings = get_settings()

# ── Engine ────────────────────────────────────────────────────────────────────
# pool_pre_ping=True: test connection health before use (handles Supabase
# connection drops after periods of inactivity).
# pool_size=5, max_overflow=5: generous for ≤ 8 concurrent users.

engine = create_async_engine(
    str(settings.database_url),
    echo=settings.is_development and settings.log_level == "DEBUG",
    future=True,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=5,
    connect_args={
        # Both of these are REQUIRED for Supabase's PgBouncer (transaction-mode pooling).
        # statement_cache_size=0 tells asyncpg not to cache prepared statements.
        # prepared_statement_cache_size=0 tells SQLAlchemy not to cache them either.
        # prepared_statement_name_func generates a UUID per statement so that
        # even if PgBouncer leaks old statement names across connections/reloads,
        # there's zero chance of a DuplicatePreparedStatementError.
        "statement_cache_size": 0,
        "prepared_statement_cache_size": 0,
        "prepared_statement_name_func": lambda: f"__asyncpg_{__import__('uuid').uuid4().hex}__",
    },
    pool_recycle=3600,  # recycle connections every hour
)

# ── Session factory ───────────────────────────────────────────────────────────

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,  # avoids lazy-load errors after commit
    autocommit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency that yields a managed async database session.

    Automatically rolls back on exception and always closes the session.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except SQLAlchemyError as exc:
            logger.error("database_error", error=str(exc), exc_info=True)
            await session.rollback()
            raise
        except Exception:
            await session.rollback()
            raise
        # Session is closed automatically by async context manager
