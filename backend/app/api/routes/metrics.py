"""Metrics API route handler."""

from fastapi import APIRouter, Depends
from backend.app.api.middleware.auth import verify_api_key

router = APIRouter(prefix="/api/v1/metrics")
