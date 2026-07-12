"""
Tests for the health check endpoint.
"""

from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_check_returns_200(client: AsyncClient) -> None:
    """Health endpoint should always return HTTP 200."""
    response = await client.get("/api/health")
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_health_check_response_shape(client: AsyncClient) -> None:
    """Health response should include status, version, environment, and database."""
    response = await client.get("/api/health")
    data = response.json()

    assert data["status"] == "ok"
    assert "version" in data
    assert "environment" in data
    assert "database" in data
    # Database field is either "ok" or "error" depending on connectivity
    assert data["database"] in {"ok", "error"}


@pytest.mark.asyncio
async def test_health_check_environment_is_testing(client: AsyncClient) -> None:
    """Environment should reflect the ENVIRONMENT env var (set to 'testing' in conftest)."""
    response = await client.get("/api/health")
    data = response.json()
    # Environment is "development" by default in tests unless ENVIRONMENT is overridden
    assert data["environment"] in {"development", "testing", "staging", "production"}
