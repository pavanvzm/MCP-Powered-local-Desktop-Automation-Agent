"""API route handlers for the AI Agent."""

import uuid
from typing import Optional

from fastapi import APIRouter, HTTPException, Query, WebSocket, WebSocketDisconnect, Depends

from backend.app.core.agent import AIAgent
from backend.app.models.schemas import (
    ChatRequest,
    ChatResponse,
    MemorySearchRequest,
    MemoryStoreRequest,
    MetricsResponse,
    TaskCreate,
    TaskResponse,
    TaskListResponse,
    ToolExecuteRequest,
    ToolListResponse,
    HealthResponse,
    ErrorResponse,
)
from backend.app.utils.logger import logger
from backend.app.api.middleware.auth import verify_api_key

router = APIRouter(prefix="/api/v1")

# Active agent sessions
_active_agents: dict[str, AIAgent] = {}


def get_or_create_agent(session_id: Optional[str] = None) -> AIAgent:
    """Get existing agent or create new one."""
    if session_id and session_id in _active_agents:
        return _active_agents[session_id]
    agent = AIAgent(session_id=session_id)
    _active_agents[agent.session_id] = agent
    return agent


@router.post("/chat", response_model=None)
async def chat(request: ChatRequest, api_key: str = Depends(verify_api_key)):
    """Send a message to the AI agent with streaming support."""
    agent = get_or_create_agent(request.session_id)
    return await agent.process_message(request.message, stream=request.stream)


@router.get("/chat/{session_id}")
async def get_conversation_history(
    session_id: str,
    limit: int = Query(50, ge=1, le=200),
    api_key: str = Depends(verify_api_key),
):
    """Retrieve conversation history for a session."""
    if session_id not in _active_agents:
        raise HTTPException(status_code=404, detail="Session not found")
    agent = _active_agents[session_id]
    messages = agent.memory.get_recent_context(limit=limit)
    return {"session_id": session_id, "messages": messages, "count": len(messages)}


@router.delete("/chat/{session_id}")
async def clear_session(session_id: str, api_key: str = Depends(verify_api_key)):
    """Clear a conversation session."""
    if session_id in _active_agents:
        agent = _active_agents[session_id]
        await agent.memory.clear()
        del _active_agents[session_id]
    return {"session_id": session_id, "status": "cleared"}


@router.post("/tasks", response_model=TaskResponse)
async def create_task(task: TaskCreate, api_key: str = Depends(verify_api_key)):
    """Create a scheduled task."""
    return TaskResponse(
        id=str(uuid.uuid4()),
        name=task.name,
        description=task.description,
        status="created",
        priority=task.priority,
        created_at=task.scheduled_at.isoformat() if task.scheduled_at else "",
    )


@router.get("/tasks/{task_id}", response_model=TaskResponse)
async def get_task(task_id: str, api_key: str = Depends(verify_api_key)):
    """Check task status."""
    return TaskResponse(
        id=task_id,
        name="Sample Task",
        status="pending",
        priority=0,
        created_at="",
    )


@router.get("/memory/{session_id}")
async def inspect_memory(
    session_id: str,
    query: Optional[str] = Query(None),
    api_key: str = Depends(verify_api_key),
):
    """Inspect agent memory for a session."""
    if session_id not in _active_agents:
        raise HTTPException(status_code=404, detail="Session not found")
    agent = _active_agents[session_id]

    result = {
        "session_id": session_id,
        "short_term": {
            "message_count": len(agent.memory.short_term.messages),
            "messages": agent.memory.get_recent_context(limit=20),
            "context": agent.memory.short_term.context,
        },
    }

    if query and agent.memory.long_term:
        memories = await agent.memory.recall(query)
        result["long_term"] = memories

    return result


@router.get("/metrics", response_model=dict)
async def get_metrics(api_key: str = Depends(verify_api_key)):
    """Get performance metrics for all active sessions."""
    all_metrics = {}
    for sid, agent in _active_agents.items():
        all_metrics[sid] = agent.get_metrics()
    return {
        "active_sessions": len(_active_agents),
        "sessions": all_metrics,
        "total_queries": sum(
            a.metrics["total_queries"] for a in _active_agents.values()
        ),
    }


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    import datetime
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        timestamp=datetime.datetime.utcnow().isoformat(),
        services={
            "api": {"status": "healthy"},
            "memory": {"status": "available"},
        },
    )


@router.post("/tools/execute")
async def execute_tool(
    request: ToolExecuteRequest,
    session_id: Optional[str] = Query(None),
    api_key: str = Depends(verify_api_key),
):
    """Direct tool execution."""
    agent = get_or_create_agent(session_id)
    result = await agent.execute_tool_directly(request.tool, **request.parameters)
    return result


@router.get("/tools", response_model=ToolListResponse)
async def list_tools(api_key: str = Depends(verify_api_key)):
    """List all available tools."""
    agent = get_or_create_agent()
    tools = agent.tool_registry.list_tools()
    return ToolListResponse(tools=tools, count=len(tools))


@router.post("/memory/{session_id}", response_model=dict)
async def store_memory(
    session_id: str,
    request: MemoryStoreRequest,
    api_key: str = Depends(verify_api_key),
):
    """Store memory for a session."""
    agent = get_or_create_agent(session_id)
    memory_id = await agent.memory.remember(request.text, request.metadata)
    return {"session_id": session_id, "memory_id": memory_id, "status": "stored"}


@router.post("/chat/ws")
async def websocket_chat(websocket: WebSocket):
    """WebSocket endpoint for real-time chat."""
    await websocket.accept()
    agent = get_or_create_agent()

    try:
        while True:
            data = await websocket.receive_json()
            message = data.get("message", "")

            async for chunk in agent.process_message(message, stream=True):
                await websocket.send_json(chunk)

    except WebSocketDisconnect:
        logger.info(f"WebSocket client disconnected: {agent.session_id}")
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
        await websocket.send_json({"type": "error", "content": str(e)})
