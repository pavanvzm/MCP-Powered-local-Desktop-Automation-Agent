"""Multi-agent orchestrator API routes."""

from fastapi import APIRouter
from pydantic import BaseModel

from backend.app.core.orchestrator import orchestrator

router = APIRouter(prefix="/api/v1/orchestrator")


class ProcessRequest(BaseModel):
    message: str


@router.post("/process")
async def process_message(request: ProcessRequest):
    """Send a message to the multi-agent orchestrator."""
    results = []
    async for chunk in orchestrator.process_message(request.message, stream=True):
        results.append(chunk)
    return results


@router.get("/status")
async def get_status():
    """Get orchestrator status."""
    return orchestrator.get_status()
