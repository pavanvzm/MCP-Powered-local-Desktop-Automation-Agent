"""API models, Pydantic schemas, and database models."""

from datetime import datetime
from typing import Any, Optional
from pydantic import BaseModel, Field


# ----- Request Schemas -----

class ChatRequest(BaseModel):
    """Chat message request."""
    message: str = Field(..., min_length=1, max_length=10000, description="User message")
    session_id: Optional[str] = Field(None, description="Session ID for conversation continuity")
    stream: bool = Field(True, description="Enable streaming response")


class TaskCreate(BaseModel):
    """Task creation request."""
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    scheduled_at: Optional[datetime] = None
    priority: int = Field(0, ge=0, le=10)
    action: str = Field(..., description="Task action definition")
    metadata: Optional[dict] = None


class TaskUpdate(BaseModel):
    """Task update request."""
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[int] = None


class ToolExecuteRequest(BaseModel):
    """Direct tool execution request."""
    tool: str = Field(..., description="Tool name to execute")
    parameters: dict = Field(default_factory=dict, description="Tool parameters")


class MemorySearchRequest(BaseModel):
    """Memory search request."""
    query: str = Field(..., min_length=1)
    n_results: int = Field(5, ge=1, le=50)


class MemoryStoreRequest(BaseModel):
    """Memory store request."""
    text: str = Field(..., min_length=1)
    metadata: Optional[dict] = None


# ----- Response Schemas -----

class ChatResponse(BaseModel):
    """Chat response."""
    type: str = "message"
    content: str
    session_id: str
    metrics: Optional[dict] = None
    error: Optional[str] = None


class TaskResponse(BaseModel):
    """Task response."""
    id: str
    name: str
    description: Optional[str]
    status: str
    priority: int
    created_at: str
    scheduled_at: Optional[str]
    completed_at: Optional[str]
    result: Optional[Any]
    error: Optional[str]


class TaskListResponse(BaseModel):
    """Task list response."""
    tasks: list[TaskResponse]
    total: int


class MemoryResponse(BaseModel):
    """Memory response."""
    id: str
    content: str
    metadata: Optional[dict]
    distance: Optional[float]


class MetricsResponse(BaseModel):
    """Metrics response."""
    total_queries: int
    total_tool_calls: int
    total_errors: int
    avg_response_time_ms: float
    tools_available: list[str]
    memory_size: int
    session_id: str
    uptime: Optional[str]


class HealthResponse(BaseModel):
    """Health check response."""
    status: str = "healthy"
    version: str = "1.0.0"
    timestamp: str
    services: dict = {}


class ToolListResponse(BaseModel):
    """Tool list response."""
    tools: list[dict]
    count: int


class ErrorResponse(BaseModel):
    """Error response."""
    error: str
    detail: Optional[str] = None
    status_code: int = 400


# ----- Database Models -----

class ConversationModel:
    """Conversation database model."""
    table_name = "conversations"
    columns = {
        "id": "UUID PRIMARY KEY DEFAULT gen_random_uuid()",
        "session_id": "VARCHAR(255) NOT NULL",
        "role": "VARCHAR(50) NOT NULL",
        "content": "TEXT NOT NULL",
        "metadata": "JSONB DEFAULT '{}'",
        "created_at": "TIMESTAMPTZ DEFAULT NOW()",
    }


class TaskModel:
    """Task database model."""
    table_name = "tasks"
    columns = {
        "id": "UUID PRIMARY KEY DEFAULT gen_random_uuid()",
        "session_id": "VARCHAR(255) NOT NULL",
        "name": "VARCHAR(255) NOT NULL",
        "description": "TEXT",
        "status": "VARCHAR(50) DEFAULT 'pending'",
        "priority": "INTEGER DEFAULT 0",
        "action": "TEXT NOT NULL",
        "result": "JSONB",
        "error": "TEXT",
        "metadata": "JSONB DEFAULT '{}'",
        "created_at": "TIMESTAMPTZ DEFAULT NOW()",
        "scheduled_at": "TIMESTAMPTZ",
        "completed_at": "TIMESTAMPTZ",
    }


class SessionModel:
    """Session database model."""
    table_name = "sessions"
    columns = {
        "id": "UUID PRIMARY KEY DEFAULT gen_random_uuid()",
        "session_id": "VARCHAR(255) UNIQUE NOT NULL",
        "metadata": "JSONB DEFAULT '{}'",
        "created_at": "TIMESTAMPTZ DEFAULT NOW()",
        "updated_at": "TIMESTAMPTZ DEFAULT NOW()",
        "is_active": "BOOLEAN DEFAULT TRUE",
    }
