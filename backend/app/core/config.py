"""Application configuration with environment variable management."""

import os
from typing import Optional
from pydantic import BaseSettings, validator, Field


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Application
    APP_NAME: str = "AI Agent Production System"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = Field(default=False, env="DEBUG")
    ENVIRONMENT: str = Field(default="development", env="ENVIRONMENT")

    # Server
    HOST: str = Field(default="0.0.0.0", env="HOST")
    PORT: int = Field(default=8000, env="PORT")
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000", "http://localhost"]

    # Security
    API_KEY: str = Field(default="", env="API_KEY")
    SECRET_KEY: str = Field(default="change-me-in-production", env="SECRET_KEY")
    RATE_LIMIT_PER_MINUTE: int = 100

    # Database - PostgreSQL
    DATABASE_URL: str = Field(default="postgresql+asyncpg://postgres:postgres@localhost:5432/ai_agent", env="DATABASE_URL")

    # Vector Database - ChromaDB
    CHROMA_DB_PATH: str = Field(default="./chroma_db", env="CHROMA_DB_PATH")
    CHROMA_DB_HOST: Optional[str] = Field(default=None, env="CHROMA_DB_HOST")
    CHROMA_DB_PORT: Optional[int] = Field(default=None, env="CHROMA_DB_PORT")

    # LLM Provider Configuration
    LLM_PROVIDER: str = Field(default="openai", env="LLM_PROVIDER")

    # OpenAI
    OPENAI_API_KEY: Optional[str] = Field(default=None, env="OPENAI_API_KEY")
    OPENAI_MODEL: str = "gpt-4-turbo-preview"

    # Anthropic
    ANTHROPIC_API_KEY: Optional[str] = Field(default=None, env="ANTHROPIC_API_KEY")
    ANTHROPIC_MODEL: str = "claude-3-opus-20240229"

    # Ollama (local open-source models)
    OLLAMA_BASE_URL: str = Field(default="http://localhost:11434", env="OLLAMA_BASE_URL")
    OLLAMA_MODEL: str = "llama3.2"

    # Agent Configuration
    AGENT_MAX_TOKENS: int = 4096
    AGENT_TEMPERATURE: float = 0.7
    AGENT_MAX_RETRIES: int = 3
    AGENT_TIMEOUT_SECONDS: int = 60
    MAX_TOOL_CALLS_PER_STEP: int = 5
    ENABLE_STREAMING: bool = True
    MEMORY_SHORT_TERM_SIZE: int = 50
    MEMORY_LONG_TERM_ENABLED: bool = True

    # Logging
    LOG_LEVEL: str = Field(default="INFO", env="LOG_LEVEL")
    LOG_FORMAT: str = "json"

    @validator("CORS_ORIGINS", pre=True)
    def parse_cors_origins(cls, value):
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",")]
        return value

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


settings = Settings()
