"""FastAPI application entry point."""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.core.config import settings
from backend.app.api.routes import (
    chat_router,
    custom_tools_router,
    voice_router,
    orchestrator_router,
    plugins_router,
    memory_viz_router,
)
from backend.app.api.middleware.logging import LoggingMiddleware
from backend.app.utils.logger import logger


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    if not settings.API_KEY:
        logger.warning("No API_KEY configured!")
    yield
    logger.info("Shutting down application")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI Agent System with Voice, Multi-Agent, Custom Tools, Plugins & Memory Viz",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(LoggingMiddleware)

# Register all routes
app.include_router(chat_router)
app.include_router(custom_tools_router)
app.include_router(voice_router)
app.include_router(orchestrator_router)
app.include_router(plugins_router)
app.include_router(memory_viz_router)


@app.get("/")
async def root():
    return {
        "name": settings.APP_NAME,
        "version": "2.0.0",
        "status": "running",
        "features": ["voice", "multi-agent", "custom-tools", "plugins", "memory-viz", "mobile"],
    }
