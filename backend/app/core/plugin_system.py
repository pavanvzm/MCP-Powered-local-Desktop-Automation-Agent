"""Plugin system for extending the AI agent with custom modules."""

import importlib
import inspect
import os
import json
import uuid
from datetime import datetime
from typing import Any, Callable, Optional

from backend.app.utils.logger import logger


class PluginHook:
    """Represents a single lifecycle hook point."""

    def __init__(self, name: str, description: str):
        self.name = name
        self.description = description
        self.handlers: list[Callable] = []

    def register(self, handler: Callable):
        self.handlers.append(handler)

    async def execute(self, context: dict) -> dict:
        results = {}
        for handler in self.handlers:
            try:
                result = handler(context)
                if inspect.iscoroutine(result):
                    result = await result
                results[handler.__name__] = result
            except Exception as e:
                logger.error(f"Plugin hook '{self.name}' handler '{handler.__name__}' failed: {e}")
                results[handler.__name__] = {"error": str(e)}
        return results


class Plugin:
    """Base class for all plugins."""

    def __init__(self, name: str, version: str, description: str, author: str = ""):
        self.id = str(uuid.uuid4())
        self.name = name
        self.version = version
        self.description = description
        self.author = author
        self.enabled = True
        self.metadata: dict = {}
        self._hooks: dict[str, Callable] = {}

    def on_load(self):
        """Called when plugin is loaded."""
        pass

    def on_unload(self):
        """Called when plugin is unloaded."""
        pass

    def on_message(self, message: str, context: dict) -> Optional[str]:
        """Intercept and potentially modify messages."""
        return None

    def on_tool_execute(self, tool_name: str, params: dict) -> Optional[dict]:
        """Intercept tool execution."""
        return None

    def on_response(self, response: str) -> Optional[str]:
        """Intercept and potentially modify responses."""
        return None

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "version": self.version,
            "description": self.description,
            "author": self.author,
            "enabled": self.enabled,
        }


class PluginRegistry:
    """Registry for managing plugins and hooks."""

    def __init__(self):
        self.plugins: dict[str, Plugin] = {}
        self.hooks: dict[str, PluginHook] = {}
        self.plugin_dir = os.path.join(os.path.dirname(__file__), "..", "plugins")

        # Register default hooks
        self._register_hook("before_message", "Called before processing a user message")
        self._register_hook("after_message", "Called after processing a user message")
        self._register_hook("before_tool", "Called before executing a tool")
        self._register_hook("after_tool", "Called after executing a tool")
        self._register_hook("before_response", "Called before sending a response")

    def _register_hook(self, name: str, description: str):
        self.hooks[name] = PluginHook(name, description)

    def register_plugin(self, plugin: Plugin):
        """Register a plugin."""
        self.plugins[plugin.name] = plugin
        plugin.on_load()
        logger.info(f"Plugin loaded: {plugin.name} v{plugin.version}")

    def unregister_plugin(self, name: str):
        """Unregister a plugin."""
        if name in self.plugins:
            self.plugins[name].on_unload()
            del self.plugins[name]
            logger.info(f"Plugin unloaded: {name}")

    def get_plugin(self, name: str) -> Optional[Plugin]:
        """Get a plugin by name."""
        return self.plugins.get(name)

    def list_plugins(self) -> list[dict]:
        """List all registered plugins."""
        return [p.to_dict() for p in self.plugins.values()]

    async def execute_hook(self, hook_name: str, context: dict) -> dict:
        """Execute all handlers for a given hook."""
        hook = self.hooks.get(hook_name)
        if not hook:
            return {}
        return await hook.execute(context)

    def discover_plugins(self):
        """Auto-discover plugins from the plugin directory."""
        os.makedirs(self.plugin_dir, exist_ok=True)
        for fname in os.listdir(self.plugin_dir):
            if fname.endswith(".py") and not fname.startswith("_"):
                try:
                    module_name = fname[:-3]
                    spec = importlib.util.spec_from_file_location(
                        module_name, os.path.join(self.plugin_dir, fname)
                    )
                    if spec and spec.loader:
                        module = importlib.util.module_from_spec(spec)
                        spec.loader.exec_module(module)
                        for name, obj in inspect.getmembers(module):
                            if (
                                inspect.isclass(obj)
                                and issubclass(obj, Plugin)
                                and obj is not Plugin
                            ):
                                self.register_plugin(obj())
                except Exception as e:
                    logger.error(f"Failed to load plugin {fname}: {e}")


plugin_registry = PluginRegistry()
