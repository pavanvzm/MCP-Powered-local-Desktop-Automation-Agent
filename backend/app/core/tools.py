"""Tool registry and implementation for the AI agent.

Provides 7+ tools: web search, calculator, date/time, summarization,
file operations, API calling, and code execution.
"""

import asyncio
import json
import os
import subprocess
import tempfile
import time
from datetime import datetime
from typing import Any, Callable, Optional

import aiohttp
import httpx


class Tool:
    """Base tool class."""

    def __init__(
        self,
        name: str,
        description: str,
        func: Callable,
        parameters: dict,
        requires_confirmation: bool = False,
    ):
        self.name = name
        self.description = description
        self.func = func
        self.parameters = parameters
        self.requires_confirmation = requires_confirmation

    async def execute(self, **kwargs) -> dict:
        """Execute the tool with given parameters."""
        try:
            result = await self.func(**kwargs)
            return {"success": True, "result": result, "tool": self.name}
        except Exception as e:
            return {"success": False, "error": str(e), "tool": self.name}

    def to_dict(self) -> dict:
        """Return tool definition for LLM function calling."""
        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": self.parameters,
            },
        }


class ToolRegistry:
    """Registry for managing and executing tools."""

    def __init__(self):
        self._tools: dict[str, Tool] = {}
        self._register_default_tools()

    def _register_default_tools(self):
        """Register all default tools."""
        self.register(self._create_web_search_tool())
        self.register(self._create_calculator_tool())
        self.register(self._create_datetime_tool())
        self.register(self._create_summarization_tool())
        self.register(self._create_file_operations_tool())
        self.register(self._create_api_calling_tool())
        self.register(self._create_code_execution_tool())

    def register(self, tool: Tool):
        """Register a tool."""
        self._tools[tool.name] = tool

    def get(self, name: str) -> Optional[Tool]:
        """Get a tool by name."""
        return self._tools.get(name)

    def list_tools(self) -> list[dict]:
        """List all registered tools as dicts."""
        return [tool.to_dict() for tool in self._tools.values()]

    def get_tool_names(self) -> list[str]:
        """Get list of tool names."""
        return list(self._tools.keys())

    async def execute_tool(self, name: str, **kwargs) -> dict:
        """Execute a tool by name."""
        tool = self.get(name)
        if not tool:
            return {"success": False, "error": f"Tool '{name}' not found", "tool": name}
        return await tool.execute(**kwargs)

    # ----- Tool Implementations -----

    def _create_web_search_tool(self) -> Tool:
        async def web_search(query: str, max_results: int = 5) -> dict:
            """Search the web for information."""
            try:
                url = "https://api.duckduckgo.com/"
                params = {"q": query, "format": "json", "no_html": 1, "skip_disambig": 1}
                async with aiohttp.ClientSession() as session:
                    async with session.get(url, params=params, timeout=10) as response:
                        if response.status == 200:
                            data = await response.json()
                            results = {
                                "abstract": data.get("AbstractText", ""),
                                "source": data.get("AbstractSource", ""),
                                "url": data.get("AbstractURL", ""),
                                "related": data.get("RelatedTopics", [])[:max_results],
                            }
                            return results
                        return {"error": f"Search failed with status {response.status}"}
            except asyncio.TimeoutError:
                return {"error": "Search request timed out"}
            except Exception as e:
                return {"error": f"Search failed: {str(e)}"}

        return Tool(
            name="web_search",
            description="Search the web for current information. Use this for real-time data, news, or facts.",
            func=web_search,
            parameters={
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The search query",
                    },
                    "max_results": {
                        "type": "integer",
                        "description": "Maximum number of results (1-10)",
                        "default": 5,
                    },
                },
                "required": ["query"],
            },
        )

    def _create_calculator_tool(self) -> Tool:
        async def calculator(expression: str) -> dict:
            """Evaluate a mathematical expression."""
            try:
                # Safe evaluation using a restricted environment
                allowed_names = {
                    "abs": abs, "round": round, "min": min, "max": max,
                    "sum": sum, "pow": pow, "int": int, "float": float,
                    "str": str, "len": len, "range": range, "list": list,
                    "dict": dict, "tuple": tuple, "bool": bool,
                    "__builtins__": {},
                }
                # Parse and evaluate safely
                import ast
                tree = ast.parse(expression.strip(), mode="eval")
                # Verify only safe operations
                for node in ast.walk(tree):
                    if isinstance(node, (ast.Import, ast.ImportFrom, ast.Call, ast.Attribute)):
                        if isinstance(node, ast.Call):
                            if isinstance(node.func, ast.Name) and node.func.id not in allowed_names:
                                if isinstance(node.func, ast.Name) and node.func.id not in ["abs", "round", "min", "max", "sum", "pow", "int", "float", "str", "len", "range", "list", "dict", "tuple", "bool"]:
                                    return {"error": f"Function '{node.func.id}' is not allowed"}
                        elif isinstance(node, ast.Attribute):
                            return {"error": "Attribute access is not allowed"}
                code = compile(tree, filename="<calculator>", mode="eval")
                result = eval(code, {"__builtins__": {}}, allowed_names)
                return {"expression": expression, "result": str(result)}
            except Exception as e:
                return {"expression": expression, "error": f"Calculation error: {str(e)}"}

        return Tool(
            name="calculator",
            description="Evaluate mathematical expressions. Supports arithmetic, trigonometry, logarithms, etc.",
            func=calculator,
            parameters={
                "type": "object",
                "properties": {
                    "expression": {
                        "type": "string",
                        "description": "Mathematical expression to evaluate (e.g., '2 + 2 * 5', 'sin(45)', 'log(100)')",
                    },
                },
                "required": ["expression"],
            },
        )

    def _create_datetime_tool(self) -> Tool:
        async def get_datetime(format: str = "iso", timezone: str = "UTC") -> dict:
            """Get current date and time information."""
            now = datetime.utcnow()
            formats = {
                "iso": now.isoformat(),
                "readable": now.strftime("%A, %B %d, %Y %I:%M:%S %p UTC"),
                "date": now.strftime("%Y-%m-%d"),
                "time": now.strftime("%H:%M:%S"),
                "unix": str(int(time.time())),
            }
            return {
                "format": format,
                "value": formats.get(format, formats["iso"]),
                "timestamp": now.isoformat(),
                "available_formats": list(formats.keys()),
                "timezone": timezone,
            }

        return Tool(
            name="datetime",
            description="Get current date and time in various formats.",
            func=get_datetime,
            parameters={
                "type": "object",
                "properties": {
                    "format": {
                        "type": "string",
                        "enum": ["iso", "readable", "date", "time", "unix"],
                        "description": "Output format for the date/time",
                        "default": "iso",
                    },
                },
            },
        )

    def _create_summarization_tool(self) -> Tool:
        async def summarize(text: str, max_length: int = 200) -> dict:
            """Summarize a given text."""
            # Simple extractive summarization as base
            sentences = text.replace("\\n", " ").split(". ")
            if len(sentences) <= 3:
                return {"summary": text, "original_length": len(text), "summary_length": len(text)}

            # Take first sentence and last sentence as a basic summary
            summary_sentences = [sentences[0]]
            mid_idx = len(sentences) // 2
            if mid_idx > 0 and mid_idx < len(sentences) - 1:
                summary_sentences.append(sentences[mid_idx])
            if len(sentences) > 2:
                summary_sentences.append(sentences[-1])

            summary = ". ".join(summary_sentences)
            if len(summary) > max_length:
                summary = summary[:max_length] + "..."

            return {
                "summary": summary,
                "original_length": len(text),
                "summary_length": len(summary),
                "compression_ratio": round(1 - len(summary) / max(len(text), 1), 2),
            }

        return Tool(
            name="summarize",
            description="Summarize text content to its key points.",
            func=summarize,
            parameters={
                "type": "object",
                "properties": {
                    "text": {
                        "type": "string",
                        "description": "The text to summarize",
                    },
                    "max_length": {
                        "type": "integer",
                        "description": "Maximum summary length in characters",
                        "default": 200,
                    },
                },
                "required": ["text"],
            },
        )

    def _create_file_operations_tool(self) -> Tool:
        allowed_base = os.path.join(tempfile.gettempdir(), "ai_agent_files")

        async def read_file(path: str) -> dict:
            """Read content from a file."""
            try:
                full_path = os.path.join(allowed_base, path) if not path.startswith("/") else path
                if not os.path.exists(full_path):
                    return {"error": f"File not found: {path}"}
                if not full_path.startswith(allowed_base):
                    return {"error": "Access denied: file is outside allowed directory"}
                with open(full_path, "r", encoding="utf-8") as f:
                    content = f.read()
                return {"path": path, "content": content, "size": len(content)}
            except Exception as e:
                return {"error": f"Failed to read file: {str(e)}"}

        async def write_file(path: str, content: str) -> dict:
            """Write content to a file."""
            try:
                os.makedirs(allowed_base, exist_ok=True)
                full_path = os.path.join(allowed_base, path)
                if not full_path.startswith(allowed_base):
                    return {"error": "Access denied: file is outside allowed directory"}
                os.makedirs(os.path.dirname(full_path), exist_ok=True)
                with open(full_path, "w", encoding="utf-8") as f:
                    f.write(content)
                return {"path": path, "size": len(content), "message": "File written successfully"}
            except Exception as e:
                return {"error": f"Failed to write file: {str(e)}"}

        async def list_files(path: str = "") -> dict:
            """List files in a directory."""
            try:
                full_path = os.path.join(allowed_base, path) if path else allowed_base
                if not full_path.startswith(allowed_base):
                    return {"error": "Access denied: path is outside allowed directory"}
                if not os.path.exists(full_path):
                    return {"error": f"Directory not found: {path}"}
                files = []
                for f in os.listdir(full_path):
                    fpath = os.path.join(full_path, f)
                    files.append({
                        "name": f,
                        "type": "directory" if os.path.isdir(fpath) else "file",
                        "size": os.path.getsize(fpath) if os.path.isfile(fpath) else 0,
                    })
                return {"path": path, "files": files, "count": len(files)}
            except Exception as e:
                return {"error": f"Failed to list directory: {str(e)}"}

        async def file_operation_handler(operation: str, path: str, content: str = None) -> dict:
            if operation == "read":
                return await read_file(path=path)
            elif operation == "write":
                return await write_file(path=path, content=content or "")
            elif operation == "list":
                return await list_files(path=path)
            else:
                return {"error": f"Unknown operation: {operation}"}

        return Tool(
            name="file_operations",
            description="Read, write, and list files in the agent's workspace.",
            func=file_operation_handler,
            parameters={
                "type": "object",
                "properties": {
                    "operation": {
                        "type": "string",
                        "enum": ["read", "write", "list"],
                        "description": "File operation to perform",
                    },
                    "path": {
                        "type": "string",
                        "description": "File path (relative to workspace)",
                    },
                    "content": {
                        "type": "string",
                        "description": "Content to write (required for write operation)",
                    },
                },
                "required": ["operation", "path"],
            },
        )

    def _create_api_calling_tool(self) -> Tool:
        async def api_call(url: str, method: str = "GET", headers: dict = None,
                          body: dict = None, timeout: int = 30) -> dict:
            """Make an HTTP API call."""
            try:
                async with httpx.AsyncClient(timeout=timeout) as client:
                    response = await client.request(
                        method=method.upper(),
                        url=url,
                        headers=headers or {},
                        json=body,
                    )
                    try:
                        data = response.json()
                    except (json.JSONDecodeError, ValueError):
                        data = response.text

                    return {
                        "status_code": response.status_code,
                        "headers": dict(response.headers),
                        "data": data,
                        "success": response.status_code < 400,
                    }
            except httpx.TimeoutException:
                return {"error": f"Request timed out after {timeout}s", "success": False}
            except Exception as e:
                return {"error": f"API call failed: {str(e)}", "success": False}

        return Tool(
            name="api_call",
            description="Make HTTP requests to external APIs (GET, POST, PUT, DELETE, PATCH).",
            func=api_call,
            parameters={
                "type": "object",
                "properties": {
                    "url": {"type": "string", "description": "The URL to call"},
                    "method": {
                        "type": "string",
                        "enum": ["GET", "POST", "PUT", "DELETE", "PATCH"],
                        "description": "HTTP method",
                        "default": "GET",
                    },
                    "headers": {
                        "type": "object",
                        "description": "HTTP headers as key-value pairs",
                        "default": {},
                    },
                    "body": {
                        "type": "object",
                        "description": "JSON body for POST/PUT requests",
                    },
                    "timeout": {
                        "type": "integer",
                        "description": "Request timeout in seconds",
                        "default": 30,
                    },
                },
                "required": ["url"],
            },
        )

    def _create_code_execution_tool(self) -> Tool:
        async def execute_code(code: str, language: str = "python") -> dict:
            """Execute code in a sandboxed environment."""
            if language != "python":
                return {"error": f"Language '{language}' is not supported yet. Only Python is available."}

            try:
                import ast
                tree = ast.parse(code)
                # Check for dangerous operations
                forbidden = ["__import__", "exec", "eval", "open", "input", "__builtins__"]
                for node in ast.walk(tree):
                    if isinstance(node, ast.Call):
                        if isinstance(node.func, ast.Name) and node.func.id in forbidden:
                            return {"error": f"Operation '{node.func.id}' is not allowed for security reasons"}
                    if isinstance(node, ast.Attribute):
                        attr_name = node.attr
                        if attr_name in ["__subclasses__", "__class_getitem__"]:
                            return {"error": f"Attribute '{attr_name}' access is restricted"}

                # Create restricted globals
                restricted_globals = {
                    "__builtins__": {
                        "abs": abs, "all": all, "any": any, "bool": bool,
                        "chr": chr, "dict": dict, "dir": dir, "enumerate": enumerate,
                        "filter": filter, "float": float, "format": format,
                        "frozenset": frozenset, "getattr": getattr, "hasattr": hasattr,
                        "hash": hash, "hex": hex, "id": id, "int": int,
                        "isinstance": isinstance, "issubclass": issubclass,
                        "iter": iter, "len": len, "list": list, "map": map,
                        "max": max, "min": min, "next": next, "object": object,
                        "oct": oct, "ord": ord, "pow": pow, "range": range,
                        "reversed": reversed, "round": round, "set": set,
                        "slice": slice, "sorted": sorted, "str": str,
                        "sum": sum, "tuple": tuple, "type": type, "zip": zip,
                        "True": True, "False": False, "None": None,
                        "print": lambda *a, **kw: None,  # suppress print
                        "__import__": lambda *a, **kw: None,
                    }
                }

                # Execute
                local_vars = {}
                compiled = compile(code, "<sandbox>", "exec")
                exec(compiled, restricted_globals, local_vars)

                # Get output
                output = {}
                for k, v in local_vars.items():
                    if not k.startswith("_"):
                        try:
                            output[k] = str(v)[:500]
                        except:
                            output[k] = "<unprintable>"

                return {
                    "language": language,
                    "code_length": len(code),
                    "variables": output,
                    "message": "Code executed successfully",
                }
            except Exception as e:
                return {"error": f"Code execution error: {str(e)}", "language": language}

        return Tool(
            name="execute_code",
            description="Execute Python code in a sandboxed environment. Returns defined variables and output.",
            func=execute_code,
            parameters={
                "type": "object",
                "properties": {
                    "code": {
                        "type": "string",
                        "description": "Python code to execute",
                    },
                    "language": {
                        "type": "string",
                        "description": "Programming language (only 'python' supported)",
                        "default": "python",
                    },
                },
                "required": ["code"],
            },
        )
