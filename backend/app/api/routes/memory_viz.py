"""Memory visualization API routes."""

from fastapi import APIRouter, Query
from typing import Optional

from backend.app.api.routes.chat import _active_agents

router = APIRouter(prefix="/api/v1/memory")


@router.get("/demo")
async def search_memory_demo(query: Optional[str] = Query(None)):
    """Search and visualize memories for demo purposes."""
    if not query:
        return {"memories": []}

    # Try to get from active agents, or return demo data
    memories = []
    for sid, agent in _active_agents.items():
        if agent.memory.long_term:
            results = await agent.memory.recall(query, n_results=5)
            memories.extend(results)

    return {
        "memories": memories,
        "total": len(memories),
        "query": query,
    }
