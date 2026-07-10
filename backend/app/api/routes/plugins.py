"""Plugin management API routes."""

from fastapi import APIRouter
from pydantic import BaseModel

from backend.app.core.plugin_system import plugin_registry

router = APIRouter(prefix="/api/v1/plugins")


class ToggleRequest(BaseModel):
    enabled: bool


@router.get("")
async def list_plugins():
    """List all registered plugins."""
    plugins = plugin_registry.list_plugins()
    return {"plugins": plugins, "count": len(plugins)}


@router.post("/{name}/toggle")
async def toggle_plugin(name: str, request: ToggleRequest):
    """Enable or disable a plugin."""
    plugin = plugin_registry.get_plugin(name)
    if not plugin:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail=f"Plugin '{name}' not found")
    plugin.enabled = request.enabled
    return {"name": name, "enabled": request.enabled, "status": "updated"}
