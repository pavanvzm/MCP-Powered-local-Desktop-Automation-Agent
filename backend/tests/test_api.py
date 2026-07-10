"""Tests for API endpoints."""

import pytest
from httpx import AsyncClient, ASGITransport

from backend.app.main import app


@pytest.fixture
def client():
    """Create test client."""
    transport = ASGITransport(app=app)
    return AsyncClient(transport=transport, base_url="http://test")


@pytest.mark.asyncio
async def test_health_endpoint():
    """Test health check endpoint."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "version" in data


@pytest.mark.asyncio
async def test_root_endpoint():
    """Test root endpoint."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "name" in data
        assert "version" in data


@pytest.mark.asyncio
async def test_list_tools():
    """Test tools listing endpoint."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/tools")
        assert response.status_code == 200
        data = response.json()
        assert "tools" in data
        assert "count" in data
        assert data["count"] >= 7


@pytest.mark.asyncio
async def test_chat_without_auth():
    """Test chat without API key when API_KEY is set."""
    from backend.app.core.config import settings
    if settings.API_KEY:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post(
                "/api/v1/chat",
                json={"message": "Hello", "stream": False},
            )
            assert response.status_code == 401


@pytest.mark.asyncio
async def test_execute_tool():
    """Test direct tool execution."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/api/v1/tools/execute",
            json={
                "tool": "calculator",
                "parameters": {"expression": "2 + 2"},
            },
        )
        assert response.status_code == 200
        assert response.json().get("success", response.json().get("tool")) is not None


@pytest.mark.asyncio
async def test_get_metrics():
    """Test metrics endpoint."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/metrics")
        assert response.status_code == 200
        assert "active_sessions" in response.json()
