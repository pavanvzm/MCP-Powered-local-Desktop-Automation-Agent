#!/usr/bin/env python3
"""Initialize the database with required tables and seed data."""

import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app.models.database import db
from backend.app.utils.logger import logger


async def init_database():
    """Initialize database tables."""
    logger.info("Initializing database...")

    try:
        await db.initialize()
        await db.run_migrations()
        logger.info("✅ Database initialized successfully!")
    except Exception as e:
        logger.error(f"❌ Database initialization failed: {e}")
        sys.exit(1)
    finally:
        await db.close()


if __name__ == "__main__":
    asyncio.run(init_database())
