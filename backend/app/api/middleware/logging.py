"""Request/response logging middleware."""

import time
import uuid

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from backend.app.utils.logger import logger


class LoggingMiddleware(BaseHTTPMiddleware):
    """Middleware for logging all API requests and responses."""

    async def dispatch(self, request: Request, call_next):
        request_id = str(uuid.uuid4())[:8]
        start_time = time.time()

        # Log request
        logger.info(
            f"Request [{request_id}] {request.method} {request.url.path}",
            extra={
                "extra_data": {
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.url.path,
                    "query_params": str(request.query_params),
                    "client_host": request.client.host if request.client else "unknown",
                }
            },
        )

        try:
            response: Response = await call_next(request)
            elapsed = (time.time() - start_time) * 1000

            # Log response
            logger.info(
                f"Response [{request_id}] {response.status_code} ({elapsed:.0f}ms)",
                extra={
                    "extra_data": {
                        "request_id": request_id,
                        "status_code": response.status_code,
                        "duration_ms": round(elapsed, 2),
                    }
                },
            )
            return response

        except Exception as e:
            elapsed = (time.time() - start_time) * 1000
            logger.error(
                f"Error [{request_id}] {type(e).__name__}: {str(e)} ({elapsed:.0f}ms)",
                extra={
                    "extra_data": {
                        "request_id": request_id,
                        "error_type": type(e).__name__,
                        "error_message": str(e),
                        "duration_ms": round(elapsed, 2),
                    }
                },
            )
            raise
