import { useEffect, useState } from "react";
import { useChatStore } from "../../store/chatStore";
import { cn } from "../../lib/utils";

export function MemoryVisualizer() {
  const memoryNodes = useChatStore((s) => s.memoryNodes);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/v1/memory/demo?query=${encodeURIComponent(query)}`
      );
      if (response.ok) {
        const data = await response.json();
        useChatStore.getState().setMemoryNodes(data.memories || []);
      }
    } catch {
      // Offline - show demo data
      useChatStore.getState().setMemoryNodes([
        { id: "1", content: `Memory about: ${query}`, timestamp: new Date().toISOString(), distance: 0.15 },
        { id: "2", content: "Related conversation context", timestamp: new Date(Date.now() - 3600000).toISOString(), distance: 0.32 },
        { id: "3", content: "Past interaction result", timestamp: new Date(Date.now() - 7200000).toISOString(), distance: 0.54 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glow-card p-4">
      <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">
        🧠 Memory Visualization
      </h3>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Search memories..."
          className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          {loading ? "..." : "🔍"}
        </button>
      </div>

      {/* Memory Graph */}
      <div className="relative mb-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-3 h-3 rounded-full bg-primary-500" />
          <span className="text-xs text-slate-500 dark:text-slate-400">Semantic distance (closer = more relevant)</span>
        </div>

        <div className="space-y-3">
          {memoryNodes.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-3xl mb-2">🧠</div>
              <p className="text-sm text-slate-400 dark:text-slate-500">
                Search memories to visualize semantic relationships
              </p>
            </div>
          ) : (
            memoryNodes.map((node) => (
              <div
                key={node.id}
                className="animate-slide-up"
                style={{
                  opacity: 1 - (node.distance || 0),
                  transform: `translateX(${(node.distance || 0) * 20}px)`,
                }}
              >
                <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:border-primary-200 dark:hover:border-primary-800 transition-colors">
                  {/* Distance indicator */}
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-xs text-white font-bold">
                    {((1 - (node.distance || 0)) * 100).toFixed(0)}%
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 dark:text-slate-300">{node.content}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(node.timestamp).toLocaleString()} · distance: {node.distance?.toFixed(3)}
                    </p>
                  </div>

                  {/* Relevance bar */}
                  <div className="flex-shrink-0 w-16">
                    <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary-500 to-purple-500 rounded-full transition-all"
                        style={{ width: `${((1 - (node.distance || 0)) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Memory Stats */}
      <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
        <div className="text-center">
          <p className="text-lg font-bold text-primary-500">{memoryNodes.length}</p>
          <p className="text-xs text-slate-400">Results</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-purple-500">
            {memoryNodes.length > 0 ? (memoryNodes.reduce((a, b) => a + (b.distance || 0), 0) / memoryNodes.length).toFixed(2) : "—"}
          </p>
          <p className="text-xs text-slate-400">Avg Distance</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-cyan-500">
            {memoryNodes.length > 0 ? `${((1 - Math.min(...memoryNodes.map(n => n.distance || 0))) * 100).toFixed(0)}%` : "—"}
          </p>
          <p className="text-xs text-slate-400">Best Match</p>
        </div>
      </div>
    </div>
  );
}
