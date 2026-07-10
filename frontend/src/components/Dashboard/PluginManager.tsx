import { useEffect, useState } from "react";
import { useChatStore } from "../../store/chatStore";
import { cn } from "../../lib/utils";
import type { PluginDef } from "../../types";

export function PluginManager() {
  const plugins = useChatStore((s) => s.plugins);
  const setPlugins = useChatStore((s) => s.setPlugins);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlugins();
  }, []);

  const fetchPlugins = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/v1/plugins`
      );
      if (response.ok) {
        const data = await response.json();
        setPlugins(data.plugins || []);
      }
    } catch {
      // Demo plugins when offline
      setPlugins([
        { id: "1", name: "LoggerPlugin", version: "1.0.0", description: "Logs all messages and tool calls", author: "System", enabled: true },
        { id: "2", name: "RateLimiter", version: "1.0.0", description: "Rate limiting for API endpoints", author: "System", enabled: true },
        { id: "3", name: "CustomFormatter", version: "0.5.0", description: "Custom response formatting", author: "Community", enabled: false },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const togglePlugin = async (name: string, currentlyEnabled: boolean) => {
    try {
      await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/v1/plugins/${name}/toggle`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enabled: !currentlyEnabled }),
        }
      );
    } catch {
      // Local toggle
      setPlugins(
        plugins.map((p) =>
          p.name === name ? { ...p, enabled: !currentlyEnabled } : p
        )
      );
    }
  };

  const handleDiscover = async () => {
    setLoading(true);
    await fetchPlugins();
  };

  if (loading) {
    return (
      <div className="glow-card p-4">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-slate-200 dark:bg-slate-700 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glow-card p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100">
          🧩 Plugin Manager
        </h3>
        <button
          onClick={handleDiscover}
          disabled={loading}
          className="px-3 py-1.5 text-xs font-medium bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
        >
          {loading ? "..." : "🔄 Discover"}
        </button>
      </div>

      <div className="space-y-2">
        {plugins.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">
            No plugins found. Click "Discover" to scan for available plugins.
          </p>
        ) : (
          plugins.map((plugin) => (
            <div
              key={plugin.id}
              className={cn(
                "flex items-center justify-between p-3 rounded-lg border transition-colors",
                plugin.enabled
                  ? "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800"
                  : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
              )}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-slate-800 dark:text-slate-200">
                    {plugin.name}
                  </span>
                  <span className="px-1.5 py-0.5 text-xs bg-slate-200 dark:bg-slate-700 rounded text-slate-500 dark:text-slate-400">
                    v{plugin.version}
                  </span>
                  {plugin.enabled && (
                    <span className="px-1.5 py-0.5 text-xs bg-green-200 dark:bg-green-800 text-green-700 dark:text-green-300 rounded">
                      active
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {plugin.description} · by {plugin.author}
                </p>
              </div>
              <button
                onClick={() => togglePlugin(plugin.name, plugin.enabled)}
                className={cn(
                  "relative w-10 h-5 rounded-full transition-colors",
                  plugin.enabled ? "bg-primary-500" : "bg-slate-300 dark:bg-slate-600"
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform",
                    plugin.enabled ? "translate-x-5" : "translate-x-0.5"
                  )}
                />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
