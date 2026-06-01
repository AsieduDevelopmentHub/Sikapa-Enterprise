"""Health and readiness probes."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_liveness(client: AsyncClient):
    response = await client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "healthy"


@pytest.mark.asyncio
async def test_health_ready(client: AsyncClient):
    response = await client.get("/health/ready")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ready"
    assert body["database"] == "ok"
