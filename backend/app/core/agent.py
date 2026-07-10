"""Core AI Agent implementation with LLM orchestration, tool calling, and memory management."""

import json
import time
import uuid
from datetime import datetime
from typing import Any, AsyncGenerator, Optional

from .config import settings
from .tools import ToolRegistry
from .memory import AgentMemory


class AIAgent:
    """Main AI Agent class orchestrating LLM calls, tools, and memory."""

    def __init__(
        self,
        session_id: Optional[str] = None,
        llm_provider: Optional[str] = None,
        api_key: Optional[str] = None,
    ):
        self.session_id = session_id or str(uuid.uuid4())
        self.tool_registry = ToolRegistry()
        self.memory = AgentMemory(
            session_id=self.session_id,
            short_term_size=settings.MEMORY_SHORT_TERM_SIZE,
            long_term_enabled=settings.MEMORY_LONG_TERM_ENABLED,
            persist_directory=settings.CHROMA_DB_PATH,
        )
        self.llm_provider = llm_provider or settings.LLM_PROVIDER
        self.api_key = api_key or self._get_default_api_key()
        self.llm_client = self._initialize_llm_client()
        self.metrics = {
            "total_queries": 0,
            "total_tool_calls": 0,
            "total_errors": 0,
            "avg_response_time_ms": 0,
            "started_at": datetime.utcnow().isoformat(),
        }

    def _get_default_api_key(self) -> Optional[str]:
        """Get default API key based on configured provider."""
        if self.llm_provider == "openai":
            return settings.OPENAI_API_KEY
        elif self.llm_provider == "anthropic":
            return settings.ANTHROPIC_API_KEY
        return None

    def _initialize_llm_client(self):
        """Initialize the LLM client based on provider configuration."""
        if self.llm_provider == "openai" and self.api_key:
            try:
                from openai import AsyncOpenAI
                return AsyncOpenAI(api_key=self.api_key)
            except ImportError:
                pass
        elif self.llm_provider == "anthropic" and self.api_key:
            try:
                from anthropic import AsyncAnthropic
                return AsyncAnthropic(api_key=self.api_key)
            except ImportError:
                pass
        return None

    async def process_message(
        self,
        message: str,
        stream: bool = True,
    ) -> AsyncGenerator[dict, None]:
        """Process a user message and generate a response."""
        start_time = time.time()
        self.metrics["total_queries"] += 1

        # Add user message to memory
        self.memory.add_message("user", message)

        # Check long-term memory for relevant context
        relevant_memories = []
        if self.memory.long_term_enabled:
            relevant_memories = await self.memory.recall(message, n_results=3)

        # Build conversation context
        context_messages = self._build_context(message, relevant_memories)

        try:
            if stream:
                async for chunk in self._stream_response(context_messages):
                    yield chunk
            else:
                response = await self._get_response(context_messages)
                yield response

        except Exception as e:
            self.metrics["total_errors"] += 1
            yield {
                "type": "error",
                "content": f"I encountered an error: {str(e)}",
                "error_type": type(e).__name__,
            }

        finally:
            elapsed_ms = (time.time() - start_time) * 1000
            prev_avg = self.metrics["avg_response_time_ms"]
            total = self.metrics["total_queries"]
            self.metrics["avg_response_time_ms"] = (
                (prev_avg * (total - 1) + elapsed_ms) / total
            )

    def _build_context(self, message: str, relevant_memories: list[dict]) -> list[dict]:
        """Build the conversation context with system prompt and history."""
        system_prompt = self._get_system_prompt()
        context = [{"role": "system", "content": system_prompt}]

        # Add relevant memories as context
        if relevant_memories:
            memory_context = "Relevant past memories:\n"
            for mem in relevant_memories:
                memory_context += f"- {mem['content']}\n"
            context.append({"role": "system", "content": memory_context})

        # Add conversation history
        recent_messages = self.memory.get_recent_context(limit=settings.MEMORY_SHORT_TERM_SIZE)
        for msg in recent_messages:
            context.append({"role": msg["role"], "content": msg["content"]})

        return context

    def _get_system_prompt(self) -> str:
        """Get the system prompt for the AI agent."""
        tools_desc = "\n".join([
            f"- {t['function']['name']}: {t['function']['description']}"
            for t in self.tool_registry.list_tools()
        ])
        return f"""You are an advanced AI agent with the following capabilities:

Available Tools:
{tools_desc}

Instructions:
1. Use tools when appropriate to fulfill user requests
2. If you need real-time data, use web_search
3. For calculations, use the calculator tool
4. Always cite your sources when using web_search
5. Be helpful, concise, and accurate
6. If a tool fails, try an alternative approach
7. You can execute Python code when needed for computations
8. Store important information in memory for future reference

You are operating in session: {self.session_id}"""

    async def _stream_response(self, messages: list[dict]):
        """Stream response from the LLM."""
        try:
            # Try using the LLM client if available
            if self.llm_client and self.llm_provider == "openai":
                response = await self.llm_client.chat.completions.create(
                    model=settings.OPENAI_MODEL,
                    messages=messages,
                    tools=self.tool_registry.list_tools(),
                    tool_choice="auto",
                    max_tokens=settings.AGENT_MAX_TOKENS,
                    temperature=settings.AGENT_TEMPERATURE,
                    stream=True,
                )

                tool_calls_buffer = {}
                content_buffer = ""

                async for chunk in response:
                    delta = chunk.choices[0].delta if chunk.choices else None
                    if not delta:
                        continue

                    if delta.content:
                        content_buffer += delta.content
                        yield {
                            "type": "content",
                            "content": delta.content,
                            "session_id": self.session_id,
                        }

                    if delta.tool_calls:
                        for tc in delta.tool_calls:
                            idx = tc.index
                            if idx not in tool_calls_buffer:
                                tool_calls_buffer[idx] = {
                                    "id": tc.id or f"call_{idx}",
                                    "function": {"name": "", "arguments": ""},
                                }
                            if tc.function:
                                if tc.function.name:
                                    tool_calls_buffer[idx]["function"]["name"] += tc.function.name
                                if tc.function.arguments:
                                    tool_calls_buffer[idx]["function"]["arguments"] += tc.function.arguments

                # Process tool calls if any
                if tool_calls_buffer:
                    yield {"type": "tool_calls_start", "count": len(tool_calls_buffer)}
                    for idx in sorted(tool_calls_buffer.keys()):
                        tc_data = tool_calls_buffer[idx]
                        tool_result = await self._execute_tool_call(
                            tc_data["function"]["name"],
                            tc_data["function"]["arguments"],
                            tc_data["id"],
                        )
                        yield tool_result

                    # Get final response after tool calls
                    if content_buffer:
                        final_content = content_buffer
                    else:
                        final_content = "I've executed the requested operations. Let me know if you need anything else!"

                    self.memory.add_message("assistant", final_content)
                    await self.memory.remember(
                        f"User asked: {messages[-1]['content']}\nAssistant responded: {final_content}",
                        {"type": "conversation", "session": self.session_id},
                    )

                    yield {
                        "type": "done",
                        "content": final_content,
                        "session_id": self.session_id,
                        "metrics": self.get_metrics(),
                    }
                else:
                    # No tool calls - just content streaming
                    if content_buffer:
                        self.memory.add_message("assistant", content_buffer)
                        await self.memory.remember(
                            f"User asked: {messages[-1]['content']}\nAssistant responded: {content_buffer}",
                            {"type": "conversation", "session": self.session_id},
                        )

                    yield {
                        "type": "done",
                        "content": content_buffer,
                        "session_id": self.session_id,
                        "metrics": self.get_metrics(),
                    }
            else:
                # Fallback: Simulated response when no LLM client is configured
                yield {"type": "content", "content": "🤖 ", "session_id": self.session_id}
                yield {"type": "content", "content": "Hello! ", "session_id": self.session_id}
                yield {"type": "content", "content": "I'm ", "session_id": self.session_id}
                yield {"type": "content", "content": "your ", "session_id": self.session_id}
                yield {"type": "content", "content": "AI ", "session_id": self.session_id}
                yield {"type": "content", "content": "Agent. ", "session_id": self.session_id}
                yield {"type": "content", "content": "I ", "session_id": self.session_id}
                yield {"type": "content", "content": "can ", "session_id": self.session_id}
                yield {"type": "content", "content": "search ", "session_id": self.session_id}
                yield {"type": "content", "content": "the ", "session_id": self.session_id}
                yield {"type": "content", "content": "web, ", "session_id": self.session_id}
                yield {"type": "content", "content": "calculate ", "session_id": self.session_id}
                yield {"type": "content", "content": "math, ", "session_id": self.session_id}
                yield {"type": "content", "content": "execute ", "session_id": self.session_id}
                yield {"type": "content", "content": "code, ", "session_id": self.session_id}
                yield {"type": "content", "content": "and ", "session_id": self.session_id}
                yield {"type": "content", "content": "more! ", "session_id": self.session_id}
                yield {"type": "content", "content": "Configure ", "session_id": self.session_id}
                yield {"type": "content", "content": "your ", "session_id": self.session_id}
                yield {"type": "content", "content": "API ", "session_id": self.session_id}
                yield {"type": "content", "content": "key ", "session_id": self.session_id}
                yield {"type": "content", "content": "in ", "session_id": self.session_id}
                yield {"type": "content", "content": "the ", "session_id": self.session_id}
                yield {"type": "content", "content": ".env ", "session_id": self.session_id}
                yield {"type": "content", "content": "file ", "session_id": self.session_id}
                yield {"type": "content", "content": "to ", "session_id": self.session_id}
                yield {"type": "content", "content": "unlock ", "session_id": self.session_id}
                yield {"type": "content", "content": "my ", "session_id": self.session_id}
                yield {"type": "content", "content": "full ", "session_id": self.session_id}
                yield {"type": "content", "content": "capabilities!", "session_id": self.session_id}

                fallback_content = (
                    "🤖 Hello! I'm your AI Agent. I can search the web, calculate math, "
                    "execute code, and more! Configure your API key in the .env file "
                    "to unlock my full capabilities!"
                )
                self.memory.add_message("assistant", fallback_content)

                yield {
                    "type": "done",
                    "content": fallback_content,
                    "session_id": self.session_id,
                    "metrics": self.get_metrics(),
                    "llm_configured": False,
                }

        except Exception as e:
            self.metrics["total_errors"] += 1
            yield {
                "type": "error",
                "content": f"Error processing message: {str(e)}",
                "error_type": type(e).__name__,
            }

    async def _get_response(self, messages: list[dict]) -> dict:
        """Get a non-streaming response."""
        try:
            if self.llm_client and self.llm_provider == "openai":
                response = await self.llm_client.chat.completions.create(
                    model=settings.OPENAI_MODEL,
                    messages=messages,
                    tools=self.tool_registry.list_tools(),
                    tool_choice="auto",
                    max_tokens=settings.AGENT_MAX_TOKENS,
                    temperature=settings.AGENT_TEMPERATURE,
                )

                content = response.choices[0].message.content or ""

                # Process tool calls
                if response.choices[0].message.tool_calls:
                    for tc in response.choices[0].message.tool_calls:
                        await self._execute_tool_call(
                            tc.function.name,
                            tc.function.arguments,
                            tc.id,
                        )

                self.memory.add_message("assistant", content)
                return {
                    "type": "done",
                    "content": content,
                    "session_id": self.session_id,
                    "metrics": self.get_metrics(),
                }
            else:
                return {
                    "type": "done",
                    "content": "Hello! I'm your AI Agent. Configure an LLM API key to use my full capabilities.",
                    "session_id": self.session_id,
                    "metrics": self.get_metrics(),
                    "llm_configured": False,
                }
        except Exception as e:
            return {
                "type": "error",
                "content": f"Error: {str(e)}",
                "session_id": self.session_id,
            }

    async def _execute_tool_call(self, name: str, args_json: str, call_id: str) -> dict:
        """Execute a tool call and return the result."""
        self.metrics["total_tool_calls"] += 1
        try:
            args = json.loads(args_json) if args_json else {}
            result = await self.tool_registry.execute_tool(name, **args)

            self.memory.set_context(f"last_tool_{name}", result)

            return {
                "type": "tool_result",
                "tool": name,
                "call_id": call_id,
                "success": result.get("success", False),
                "result": result.get("result", result),
                "error": result.get("error"),
            }
        except json.JSONDecodeError as e:
            return {
                "type": "tool_result",
                "tool": name,
                "call_id": call_id,
                "success": False,
                "error": f"Invalid arguments JSON: {str(e)}",
            }
        except Exception as e:
            return {
                "type": "tool_result",
                "tool": name,
                "call_id": call_id,
                "success": False,
                "error": str(e),
            }

    def get_metrics(self) -> dict:
        """Get current agent metrics."""
        return {
            **self.metrics,
            "tools_available": self.tool_registry.get_tool_names(),
            "memory_size": len(self.memory.short_term.messages),
            "session_id": self.session_id,
        }

    async def get_tool(self, name: str):
        """Get a specific tool by name."""
        return self.tool_registry.get(name)

    async def execute_tool_directly(self, name: str, **kwargs) -> dict:
        """Execute a tool directly (bypassing LLM)."""
        return await self.tool_registry.execute_tool(name, **kwargs)
