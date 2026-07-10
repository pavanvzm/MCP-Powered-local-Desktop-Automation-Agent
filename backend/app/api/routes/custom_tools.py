"""Custom tool creation API routes."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.app.core.custom_tools import custom_tool_manager
from backend.app.core.agent import ToolRegistry

router = APIRouter(prefix="/api/v1/tools/custom")


class CreateCustomToolRequest(BaseModel):
    name: str
    description: str
    code: str
    parameters: list[dict] = []


@router.post("")
async def create_custom_tool(request: CreateCustomToolRequest):
    """Create a new custom tool."""
    tool = custom_tool_manager.create_tool(
        name=request.name,
        description=request.description,
        code=request.code,
        parameters=request.parameters,
    )
    return tool.to_dict()


@router.get("")
async def list_custom_tools():
    """List all custom tools."""
    tools = custom_tool_manager.list_tools()
    return {"tools": tools, "count": len(tools)}


@router.delete("/{tool_id}")
async def delete_custom_tool(tool_id: str):
    """Delete a custom tool."""
    success = custom_tool_manager.delete_tool(tool_id)
    if not success:
        raise HTTPException(status_code=404, detail="Tool not found")
    return {"status": "deleted", "tool_id": tool_id}


@router.post("/{tool_id}/register")
async def register_custom_tool(tool_id: str):
    """Register a custom tool with the agent."""
    registry = ToolRegistry()
    success = custom_tool_manager.register_with_registry(registry, tool_id)
    if not success:
        raise HTTPException(status_code=404, detail="Tool not found")
    return {"status": "registered", "tool_id": tool_id}
