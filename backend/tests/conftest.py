"""
Shared test fixtures and configuration.

Uses httpx.AsyncClient with ASGITransport to test FastAPI routes
without spinning up a real HTTP server.

The test database uses the DATABASE_URL from the environment.
For CI, set DATABASE_URL to a dedicated Supabase test project.
For local dev, the same Supabase instance can be used with a
separate schema or a test prefix in table names (future enhancement).
"""

from __future__ import annotations

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.fixture(scope="session")
def anyio_backend() -> str:
    return "asyncio"


@pytest_asyncio.fixture
async def client() -> AsyncClient:
    """Yield an async test client for the FastAPI application."""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        yield ac
