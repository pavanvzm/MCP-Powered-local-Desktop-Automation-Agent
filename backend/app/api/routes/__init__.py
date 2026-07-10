"""API routes package."""

from .chat import router as chat_router
from .tasks import router as tasks_router
from .memory import router as memory_router
from .metrics import router as metrics_router
from .custom_tools import router as custom_tools_router
from .voice import router as voice_router
from .orchestrator import router as orchestrator_router
from .plugins import router as plugins_router
from .memory_viz import router as memory_viz_router
