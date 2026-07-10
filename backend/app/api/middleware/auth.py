"""Authentication and security middleware."""

import time
from typing import Optional

from fastapi import HTTPException, Security
from fastapi.security import APIKeyHeader
from starlette.requests import Request
from starlette.status import HTTP_401_UNAUTHORIZED, HTTP_429_TOO_MANY_REQUESTS

from backend.app.core.config import settings
from backend.app.utils.logger import logger

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


# Rate limiting state
_rate_limit_store: dict[str, list[float]] = {}


async def verify_api_key(
    api_key: Optional[str] = Security(api_key_header),
    request: Request = None,
) -> str:
    """Verify API key and enforce rate limiting."""
    client_ip = request.client.host if request else "unknown"
    
    # Rate limiting
    _enforce_rate_limit(client_ip)

    # API key check
    if settings.API_KEY:
        if not api_key:
            raise HTTPException(
                status_code=HTTP_401_UNAUTHORIZED,
                detail="API key is required. Provide it via X-API-Key header.",
            )
        if api_key != settings.API_KEY:
            raise HTTPException(
                status_code=HTTP_401_UNAUTHORIZED,
                detail="Invalid API key.",
            )
    
    return api_key or "demo-key"


def _enforce_rate_limit(client_ip: str):
    """Enforce rate limiting per client IP."""
    now = time.time()
    window = 60.0  # 1 minute window

    # Clean old entries
    if client_ip in _rate_limit_store:
        _rate_limit_store[client_ip] = [
            t for t in _rate_limit_store[client_ip]
            if now - t < window
        ]
    else:
        _rate_limit_store[client_ip] = []

    # Check limit
    if len(_rate_limit_store[client_ip]) >= settings.RATE_LIMIT_PER_MINUTE:
        raise HTTPException(
            status_code=HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded. Maximum {settings.RATE_LIMIT_PER_MINUTE} requests per minute.",
        )

    # Add current request
    _rate_limit_store[client_ip].append(now)
