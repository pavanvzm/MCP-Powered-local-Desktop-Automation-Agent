"""Multi-agent orchestration system with supervisor agent pattern."""

import asyncio
import json
import uuid
from datetime import datetime
from typing import Any, AsyncGenerator, Optional

from backend.app.core.agent import AIAgent
from backend.app.core.tools import ToolRegistry, Tool
from backend.app.utils.logger import logger


class AgentTask:
    """Represents a task for agent delegation."""

    def __init__(self, description: str, agent_type: str = "general", priority: int = 0):
        self.id = str(uuid.uuid4())
        self.description = description
        self.agent_type = agent_type
        self.priority = priority
        self.status = "pending"
        self.result: Optional[Any] = None
        self.error: Optional[str] = None
        self.created_at = datetime.utcnow().isoformat()
        self.completed_at: Optional[str] = None


class SubAgent:
    """A specialized sub-agent that can handle specific types of tasks."""

    def __init__(self, name: str, specialization: str, tools: list[str]):
        self.name = name
        self.specialization = specialization
        self.agent = AIAgent(session_id=f"sub_{name}")
        self.tools = tools
        self.is_busy = False
        self.tasks_completed = 0

    async def process(self, task: AgentTask) -> dict:
        """Process a task with this sub-agent."""
        self.is_busy = True
        try:
            result = {
                "agent": self.name,
                "specialization": self.specialization,
                "task_id": task.id,
                "result": f"[{self.name}] processed: {task.description}",
            }
            self.tasks_completed += 1
            return result
        finally:
            self.is_busy = False


class MultiAgentOrchestrator:
    """Orchestrates multiple agents with supervisor pattern."""

    def __init__(self):
        self.supervisor = AIAgent(session_id="supervisor")
        self.sub_agents: dict[str, SubAgent] = {}
        self.task_queue: list[AgentTask] = []
        self._initialize_sub_agents()

    def _initialize_sub_agents(self):
        """Initialize specialized sub-agents."""
        agents = [
            SubAgent("researcher", "web research and data gathering", ["web_search", "api_call"]),
            SubAgent("analyst", "data analysis and calculations", ["calculator", "execute_code"]),
            SubAgent("writer", "content creation and summarization", ["summarize", "file_operations"]),
            SubAgent("coder", "code generation and execution", ["execute_code", "file_operations"]),
        ]
        for agent in agents:
            self.sub_agents[agent.name] = agent

    async def process_message(self, message: str, stream: bool = True) -> AsyncGenerator[dict, None]:
        """Process a message using the supervisor to delegate to sub-agents."""
        # Supervisor analyzes the message
        yield {"type": "content", "content": f"🧠 Supervisor analyzing: '{message}'...\n", "session_id": "supervisor"}

        # Determine which agents to use
        tasks = self._decompose_task(message)
        assigned = []

        for task in tasks:
            best_agent = self._select_agent(task)
            if best_agent:
                assigned.append((best_agent, task))
                yield {
                    "type": "content",
                    "content": f"  → Delegating to **{best_agent.name}** ({best_agent.specialization})\n",
                    "session_id": "supervisor",
                }

        # Execute tasks in parallel
        if assigned:
            results = await asyncio.gather(*[agent.process(task) for agent, task in assigned])
            yield {
                "type": "content",
                "content": "\n**Results:**\n" + "\n".join([f"- {r.get('result', 'done')}" for r in results]),
                "session_id": "supervisor",
            }

        yield {
            "type": "done",
            "content": "✅ Multi-agent processing complete!",
            "session_id": "supervisor",
            "metrics": self.supervisor.get_metrics(),
        }

    def _decompose_task(self, message: str) -> list[AgentTask]:
        """Decompose a complex task into sub-tasks."""
        return [AgentTask(description=message, agent_type="general")]

    def _select_agent(self, task: AgentTask) -> Optional[SubAgent]:
        """Select the best agent for a task."""
        available = [a for a in self.sub_agents.values() if not a.is_busy]
        if not available:
            return list(self.sub_agents.values())[0]
        return available[0]

    def get_status(self) -> dict:
        """Get orchestrator status."""
        return {
            "agents": {
                name: {
                    "specialization": agent.specialization,
                    "is_busy": agent.is_busy,
                    "tasks_completed": agent.tasks_completed,
                }
                for name, agent in self.sub_agents.items()
            },
            "queue_size": len(self.task_queue),
        }


orchestrator = MultiAgentOrchestrator()
