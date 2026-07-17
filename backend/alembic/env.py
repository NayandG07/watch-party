"""
Alembic environment configuration.

Reads the database URL from pydantic-settings (which loads .env),
imports all ORM models for autogenerate, and supports both offline
and online (async) migration modes.
"""

from __future__ import annotations

import asyncio
from logging.config import fileConfig

from alembic import context
import sqlalchemy as sa
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from app.core.config import get_settings

# ── Import all models so Alembic can detect schema changes ────────────────────
# This import triggers all model modules to register with Base.metadata.
import app.models  # noqa: F401

from app.db.base import Base

# ── Alembic config ────────────────────────────────────────────────────────────

alembic_config = context.config
settings = get_settings()

# Override sqlalchemy.url from pydantic-settings (reads .env)
# asyncpg URL must be converted to sync format for offline mode
_async_url = str(settings.database_url)
# Alembic needs a direct connection (port 5432), not the PgBouncer pooler (6543)
# because the pooler doesn't support prepared statements used during introspection.
_async_url = _async_url.replace(":6543/", ":5432/")
# Do NOT append query args — we pass options via connect_args below instead
_sync_url = _async_url.replace("postgresql+asyncpg://", "postgresql://")

if alembic_config.config_file_name is not None:
    fileConfig(alembic_config.config_file_name)

target_metadata = Base.metadata


# ── Offline mode ──────────────────────────────────────────────────────────────

def run_migrations_offline() -> None:
    """Run migrations without an active database connection.

    Useful for generating SQL scripts for review before applying.
    """
    context.configure(
        url=_sync_url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        render_as_batch=True,
    )
    with context.begin_transaction():
        context.run_migrations()


# ── Online (async) mode ───────────────────────────────────────────────────────

def do_run_migrations(connection: Connection) -> None:
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,
        render_as_batch=True,
    )
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Run migrations against the live Supabase PostgreSQL instance."""
    config_section = alembic_config.get_section(alembic_config.config_ini_section) or {}
    config_section["sqlalchemy.url"] = _async_url

    connectable = async_engine_from_config(
        config_section,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
        connect_args={
            "prepared_statement_cache_size": 0,
            "statement_cache_size": 0,
        },
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


# ── Entry point ───────────────────────────────────────────────────────────────

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
