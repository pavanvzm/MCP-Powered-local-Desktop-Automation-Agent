"""Custom tool creation system for user-defined tools."""

import json
import uuid
from datetime import datetime
from typing import Any, Callable, Optional

from backend.app.core.tools import Tool, ToolRegistry
from backend.app.utils.logger import logger


class CustomTool:
    """A user-defined custom tool."""

    def __init__(
        self,
        name: str,
        description: str,
        code: str,
        parameters: list[dict],
        user_id: str = "anonymous",
    ):
        self.id = str(uuid.uuid4())
        self.name = name
        self.description = description
        self.code = code
        self.parameters = parameters
        self.user_id = user_id
        self.created_at = datetime.utcnow().isoformat()
        self.updated_at = self.created_at
        self.version = 1

    def to_tool(self) -> Tool:
        """Convert to a Tool instance for execution."""
        code = self.code
        params_schema = {
            "type": "object",
            "properties": {},
            "required": [],
        }
        for p in self.parameters:
            param_name = p.get("name", "param")
            param_type = p.get("type", "string")
            param_desc = p.get("description", "")
            param_required = p.get("required", False)
            params_schema["properties"][param_name] = {
                "type": param_type,
                "description": param_desc,
            }
            if param_required:
                params_schema["required"].append(param_name)

        async def execute_fn(**kwargs) -> dict:
            """Execute the custom tool's code."""
            try:
                local_vars = {"params": kwargs, "result": None}
                exec(code, {"__builtins__": {}}, local_vars)
                result = local_vars.get("result", "Executed successfully")
                return {"success": True, "result": result}
            except Exception as e:
                return {"success": False, "error": str(e)}

        return Tool(
            name=self.name,
            description=self.description,
            func=execute_fn,
            parameters=params_schema,
        )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "parameters": self.parameters,
            "code": self.code,
            "created_at": self.created_at,
            "version": self.version,
        }


class CustomToolManager:
    """Manages user-defined custom tools."""

    def __init__(self):
        self._tools: dict[str, CustomTool] = {}

    def create_tool(self, name: str, description: str, code: str, parameters: list[dict]) -> CustomTool:
        """Create and register a new custom tool."""
        tool = CustomTool(name, description, code, parameters)
        self._tools[tool.id] = tool
        return tool

    def get_tool(self, tool_id: str) -> Optional[CustomTool]:
        """Get a custom tool by ID."""
        return self._tools.get(tool_id)

    def get_tool_by_name(self, name: str) -> Optional[CustomTool]:
        """Get a custom tool by name."""
        for tool in self._tools.values():
            if tool.name == name:
                return tool
        return None

    def delete_tool(self, tool_id: str) -> bool:
        """Delete a custom tool."""
        if tool_id in self._tools:
            del self._tools[tool_id]
            return True
        return False

    def list_tools(self) -> list[dict]:
        """List all custom tools."""
        return [t.to_dict() for t in self._tools.values()]

    def register_with_registry(self, registry: ToolRegistry, tool_id: str) -> bool:
        """Register a custom tool with the agent's tool registry."""
        tool = self.get_tool(tool_id)
        if tool:
            registry.register(tool.to_tool())
            return True
        return False


custom_tool_manager = CustomToolManager()
