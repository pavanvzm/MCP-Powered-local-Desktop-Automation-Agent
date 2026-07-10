"""FastAPI application entry point."""

import os
import sys

# Add the backend directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.app.core.config import settings
from backend.app.api.routes import chat_router
from backend.app.api.middleware.logging import LoggingMiddleware
from backend.app.utils.logger import logger


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"LLM Provider: {settings.LLM_PROVIDER}")

    # Check API key configuration
    if not settings.API_KEY:
        logger.warning("No API_KEY configured! Set API_KEY in .env for production.")

    # Check LLM configuration
    if settings.LLM_PROVIDER == "openai" and not settings.OPENAI_API_KEY:
        logger.warning("OpenAI selected but OPENAI_API_KEY not set. Agent will run with limited capabilities.")
    elif settings.LLM_PROVIDER == "anthropic" and not settings.ANTHROPIC_API_KEY:
        logger.warning("Anthropic selected but ANTHROPIC_API_KEY not set. Agent will run with limited capabilities.")

    yield

    logger.info("Shutting down application")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Production-grade AI agent system with natural language understanding, "
                "task automation, API integration, persistent memory, and error recovery.",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logging middleware
app.add_middleware(LoggingMiddleware)

# Include API routes
app.include_router(chat_router)


@app.get("/")
async def root():
    """Root endpoint with API info."""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "docs": "/docs",
        "health": "/api/v1/health",
    }
