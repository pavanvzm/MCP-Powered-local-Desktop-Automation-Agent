"""Helper utilities for the application."""

import re
import hashlib
import uuid
from datetime import datetime, timezone
from typing import Any


def generate_session_id() -> str:
    """Generate a unique session ID."""
    return str(uuid.uuid4())


def generate_api_key() -> str:
    """Generate a secure API key."""
    return f"sk-{hashlib.sha256(uuid.uuid4().bytes).hexdigest()[:48]}"


def sanitize_input(text: str) -> str:
    """Sanitize user input."""
    # Remove potentially dangerous characters
    text = re.sub(r"[<>\"]", "", text)
    # Limit length
    text = text[:10000]
    return text.strip()


def truncate_text(text: str, max_length: int = 1000) -> str:
    """Truncate text to a maximum length."""
    if len(text) <= max_length:
        return text
    return text[:max_length - 3] + "..."


def format_timestamp(dt: Optional[datetime] = None) -> str:
    """Format a timestamp to ISO format."""
    if dt is None:
        dt = datetime.now(timezone.utc)
    return dt.isoformat()


def parse_llm_response(response: Any) -> str:
    """Extract text content from various LLM response formats."""
    if isinstance(response, str):
        return response
    if hasattr(response, "content"):
        return response.content
    if isinstance(response, dict):
        return response.get("content", str(response))
    return str(response)


def calculate_compression_ratio(original: str, compressed: str) -> float:
    """Calculate compression ratio between original and compressed text."""
    if not original:
        return 0.0
    return round(1 - (len(compressed) / len(original)), 4)
