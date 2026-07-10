"""Memory management for the AI agent with short-term and long-term storage."""

import json
import uuid
from datetime import datetime
from typing import Any, Optional

import chromadb
from chromadb.config import Settings as ChromaSettings


class ShortTermMemory:
    """In-memory conversation buffer for recent context."""

    def __init__(self, max_size: int = 50):
        self.max_size = max_size
        self.messages: list[dict] = []
        self.context: dict[str, Any] = {}

    def add_message(self, role: str, content: str, metadata: Optional[dict] = None):
        """Add a message to short-term memory."""
        message = {
            "id": str(uuid.uuid4()),
            "role": role,
            "content": content,
            "timestamp": datetime.utcnow().isoformat(),
            "metadata": metadata or {},
        }
        self.messages.append(message)
        if len(self.messages) > self.max_size:
            self.messages.pop(0)
        return message

    def get_messages(self, limit: Optional[int] = None) -> list[dict]:
        """Get recent messages."""
        if limit:
            return self.messages[-limit:]
        return self.messages

    def set_context(self, key: str, value: Any):
        """Set a context variable."""
        self.context[key] = value

    def get_context(self, key: str) -> Optional[Any]:
        """Get a context variable."""
        return self.context.get(key)

    def clear(self):
        """Clear all messages and context."""
        self.messages.clear()
        self.context.clear()

    def to_dict(self) -> dict:
        """Serialize to dict."""
        return {
            "messages": self.messages,
            "context": self.context,
        }

    @classmethod
    def from_dict(cls, data: dict) -> "ShortTermMemory":
        """Deserialize from dict."""
        memory = cls(max_size=50)
        memory.messages = data.get("messages", [])
        memory.context = data.get("context", {})
        return memory


class LongTermMemory:
    """Vector-based semantic memory using ChromaDB."""

    def __init__(self, collection_name: str = "agent_memory", persist_directory: str = "./chroma_db"):
        self.collection_name = collection_name
        self.persist_directory = persist_directory
        self.client = chromadb.PersistentClient(
            path=persist_directory,
            settings=ChromaSettings(anonymized_telemetry=False),
        )
        self.collection = self.client.get_or_create_collection(
            name=collection_name,
            metadata={"hnsw:space": "cosine"},
        )

    async def store(self, text: str, metadata: Optional[dict] = None) -> str:
        """Store a memory embedding."""
        memory_id = str(uuid.uuid4())
        self.collection.add(
            documents=[text],
            metadatas=[metadata or {"timestamp": datetime.utcnow().isoformat()}],
            ids=[memory_id],
        )
        return memory_id

    async def search(self, query: str, n_results: int = 5) -> list[dict]:
        """Search for similar memories."""
        results = self.collection.query(
            query_texts=[query],
            n_results=n_results,
        )
        memories = []
        if results["documents"] and results["documents"][0]:
            for i, doc in enumerate(results["documents"][0]):
                memories.append({
                    "id": results["ids"][0][i] if results["ids"] else "",
                    "content": doc,
                    "metadata": results["metadatas"][0][i] if results["metadatas"] else {},
                    "distance": results["distances"][0][i] if results["distances"] else 0.0,
                })
        return memories

    async def delete(self, memory_id: str) -> bool:
        """Delete a memory by ID."""
        try:
            self.collection.delete(ids=[memory_id])
            return True
        except Exception:
            return False

    async def get_all(self, limit: int = 100) -> list[dict]:
        """Get all memories."""
        results = self.collection.get(limit=limit)
        memories = []
        if results["documents"]:
            for i, doc in enumerate(results["documents"]):
                memories.append({
                    "id": results["ids"][i] if results["ids"] else "",
                    "content": doc,
                    "metadata": results["metadatas"][i] if results["metadatas"] else {},
                })
        return memories

    async def count(self) -> int:
        """Get total memory count."""
        return self.collection.count()


class AgentMemory:
    """Combined memory system with short-term and long-term storage."""

    def __init__(
        self,
        session_id: str,
        short_term_size: int = 50,
        long_term_enabled: bool = True,
        persist_directory: str = "./chroma_db",
    ):
        self.session_id = session_id
        self.short_term = ShortTermMemory(max_size=short_term_size)
        self.long_term_enabled = long_term_enabled
        self.long_term: Optional[LongTermMemory] = None
        if long_term_enabled:
            self.long_term = LongTermMemory(
                collection_name=f"session_{session_id}",
                persist_directory=persist_directory,
            )

    def add_message(self, role: str, content: str, metadata: Optional[dict] = None):
        """Add a message to short-term memory."""
        return self.short_term.add_message(role, content, metadata)

    def get_recent_context(self, limit: Optional[int] = None) -> list[dict]:
        """Get recent conversation context."""
        return self.short_term.get_messages(limit)

    async def remember(self, text: str, metadata: Optional[dict] = None) -> Optional[str]:
        """Store in long-term memory."""
        if self.long_term:
            return await self.long_term.store(text, metadata)
        return None

    async def recall(self, query: str, n_results: int = 5) -> list[dict]:
        """Search long-term memory."""
        if self.long_term:
            return await self.long_term.search(query, n_results)
        return []

    def set_context(self, key: str, value: Any):
        """Set context variable."""
        self.short_term.set_context(key, value)

    def get_context(self, key: str) -> Optional[Any]:
        """Get context variable."""
        return self.short_term.get_context(key)

    async def clear(self):
        """Clear short-term memory."""
        self.short_term.clear()

    async def cleanup(self):
        """Cleanup resources."""
        self.short_term.clear()
