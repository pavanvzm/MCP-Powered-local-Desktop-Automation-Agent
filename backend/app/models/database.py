"""Database initialization and connection management."""

from typing import Optional
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.sql import text

from backend.app.core.config import settings
from backend.app.models.schemas import ConversationModel, TaskModel, SessionModel


class Database:
    """Database connection manager with connection pooling."""

    def __init__(self):
        self.engine = None
        self.session_factory = None
        self._initialized = False

    async def initialize(self, database_url: Optional[str] = None):
        """Initialize database connection pool."""
        url = database_url or settings.DATABASE_URL
        self.engine = create_async_engine(
            url,
            pool_size=10,
            max_overflow=20,
            pool_pre_ping=True,
            pool_recycle=3600,
            echo=settings.DEBUG,
        )
        self.session_factory = async_sessionmaker(
            self.engine,
            class_=AsyncSession,
            expire_on_commit=False,
        )
        self._initialized = True

    async def get_session(self) -> AsyncSession:
        """Get a database session."""
        if not self._initialized:
            await self.initialize()
        async with self.session_factory() as session:
            yield session

    async def run_migrations(self):
        """Run database migrations - create tables if they don't exist."""
        if not self._initialized:
            await self.initialize()

        async with self.engine.begin() as conn:
            # Create tables
            for model in [SessionModel, ConversationModel, TaskModel]:
                columns_def = ", ".join(
                    f"{name} {definition}"
                    for name, definition in model.columns.items()
                )
                await conn.execute(text(f"""
                    CREATE TABLE IF NOT EXISTS {model.table_name} (
                        {columns_def}
                    )
                """))

            # Create indexes
            await conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_conversations_session
                ON conversations(session_id)
            """))
            await conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_tasks_session
                ON tasks(session_id)
            """))
            await conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_tasks_status
                ON tasks(status)
            """))

    async def health_check(self) -> dict:
        """Check database connectivity."""
        try:
            async with self.engine.connect() as conn:
                await conn.execute(text("SELECT 1"))
            return {"status": "healthy", "type": "postgresql"}
        except Exception as e:
            return {"status": "unhealthy", "error": str(e), "type": "postgresql"}

    async def close(self):
        """Close all connections."""
        if self.engine:
            await self.engine.dispose()


# Global database instance
db = Database()
