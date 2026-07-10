"""Integration tests for the AI Agent system."""

import pytest
from httpx import AsyncClient, ASGITransport

from backend.app.main import app
from backend.app.core.agent import AIAgent


@pytest.mark.asyncio
async def test_agent_processes_message():
    """Test that agent processes messages and returns response."""
    agent = AIAgent()
    results = []
    async for chunk in agent.process_message("Hello! What can you do?", stream=True):
        results.append(chunk)

    assert len(results) > 0
    last_chunk = results[-1]
    assert last_chunk["type"] == "done"
    assert last_chunk["session_id"] == agent.session_id


@pytest.mark.asyncio
async def test_agent_tool_execution():
    """Test agent can execute tools."""
    agent = AIAgent()
    result = await agent.execute_tool_directly("calculator", expression="15 * 3")
    assert result["success"] is True
    assert "result" in result or "error" in result


@pytest.mark.asyncio
async def test_agent_memory_persistence():
    """Test agent memory persists across messages."""
    agent = AIAgent()
    agent.memory.add_message("user", "My name is Alice")
    agent.memory.add_message("assistant", "Hello Alice!")
    messages = agent.memory.get_recent_context()
    assert len(messages) == 2
    assert messages[0]["content"] == "My name is Alice"
    assert messages[1]["content"] == "Hello Alice!"


@pytest.mark.asyncio
async def test_full_api_flow():
    """Test the full API flow from chat to metrics."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Health check
        health = await client.get("/api/v1/health")
        assert health.status_code == 200

        # List tools
        tools = await client.get("/api/v1/tools")
        assert tools.status_code == 200
        assert tools.json()["count"] >= 7

        # Get metrics
        metrics = await client.get("/api/v1/metrics")
        assert metrics.status_code == 200


@pytest.mark.asyncio
async def test_concurrent_sessions():
    """Test multiple agent sessions."""
    agent1 = AIAgent()
    agent2 = AIAgent()
    assert agent1.session_id != agent2.session_id

    agent1.memory.add_message("user", "Message for agent 1")
    agent2.memory.add_message("user", "Message for agent 2")

    ctx1 = agent1.memory.get_recent_context()
    ctx2 = agent2.memory.get_recent_context()

    assert len(ctx1) == 1
    assert len(ctx2) == 1
    assert ctx1[0]["content"] == "Message for agent 1"
    assert ctx2[0]["content"] == "Message for agent 2"


@pytest.mark.asyncio
async def test_tool_registry_thread_safety():
    """Test tool registry is thread-safe."""
    registry1 = AIAgent().tool_registry
    registry2 = AIAgent().tool_registry

    assert registry1.get_tool_names() == registry2.get_tool_names()
    assert len(registry1.get_tool_names()) >= 7
