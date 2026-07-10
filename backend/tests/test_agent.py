"""Tests for the AI Agent core."""

import pytest

from backend.app.core.agent import AIAgent
from backend.app.core.tools import ToolRegistry, Tool


@pytest.fixture
def agent():
    """Create a test agent."""
    return AIAgent()


@pytest.fixture
def tool_registry():
    """Create a test tool registry."""
    return ToolRegistry()


@pytest.mark.asyncio
async def test_agent_initialization():
    """Test agent initialization."""
    agent = AIAgent()
    assert agent.session_id is not None
    assert agent.tool_registry is not None
    assert agent.memory is not None
    assert agent.metrics["total_queries"] == 0


@pytest.mark.asyncio
async def test_agent_session_id():
    """Test session ID generation."""
    agent1 = AIAgent()
    agent2 = AIAgent()
    assert agent1.session_id != agent2.session_id


@pytest.mark.asyncio
async def test_agent_memory():
    """Test agent memory operations."""
    agent = AIAgent()
    agent.memory.add_message("user", "Hello")
    agent.memory.add_message("assistant", "Hi there!")
    messages = agent.memory.get_recent_context()
    assert len(messages) == 2
    assert messages[0]["role"] == "user"
    assert messages[1]["role"] == "assistant"


@pytest.mark.asyncio
async def test_tool_registry():
    """Test tool registry has all default tools."""
    registry = ToolRegistry()
    tool_names = registry.get_tool_names()
    expected_tools = [
        "web_search", "calculator", "datetime",
        "summarize", "file_operations", "api_call", "execute_code",
    ]
    for tool in expected_tools:
        assert tool in tool_names, f"Missing tool: {tool}"
    assert len(tool_names) >= 7


@pytest.mark.asyncio
async def test_calculator_tool():
    """Test calculator tool."""
    registry = ToolRegistry()
    result = await registry.execute_tool("calculator", expression="2 + 2")
    assert result["success"] is True or "result" in result


@pytest.mark.asyncio
async def test_datetime_tool():
    """Test datetime tool."""
    registry = ToolRegistry()
    result = await registry.execute_tool("datetime", format="iso")
    assert result["success"] is True or "value" in result


@pytest.mark.asyncio
async def test_summarize_tool():
    """Test summarization tool."""
    registry = ToolRegistry()
    result = await registry.execute_tool(
        "summarize",
        text="This is a long text that needs to be summarized. It has multiple sentences. "
             "Each sentence adds more information. The summary should capture the key points. "
             "This is useful for quickly understanding content.",
    )
    assert result["success"] is True or "summary" in result


@pytest.mark.asyncio
async def test_tool_not_found():
    """Test tool not found error."""
    registry = ToolRegistry()
    result = await registry.execute_tool("nonexistent_tool")
    assert result["success"] is False
    assert "error" in result


@pytest.mark.asyncio
async def test_agent_metrics():
    """Test agent metrics."""
    agent = AIAgent()
    metrics = agent.get_metrics()
    assert "total_queries" in metrics
    assert "total_tool_calls" in metrics
    assert "tools_available" in metrics
    assert "memory_size" in metrics
