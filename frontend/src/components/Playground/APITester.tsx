import { useState } from "react";
import agentService from "../../services/agentService";
import { cn } from "../../lib/utils";

export function APITester() {
  const [endpoint, setEndpoint] = useState("/api/v1/health");
  const [response, setResponse] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const endpoints = [
    { path: "/api/v1/health", label: "Health Check", method: "GET" },
    { path: "/api/v1/tools", label: "List Tools", method: "GET" },
    { path: "/api/v1/metrics", label: "Get Metrics", method: "GET" },
  ];

  const handleExecute = async () => {
    setLoading(true);
    setResponse("");
    try {
      let result;
      if (endpoint === "/api/v1/health") result = await agentService.getHealth();
      else if (endpoint === "/api/v1/tools") result = await agentService.getTools();
      else if (endpoint === "/api/v1/metrics") result = await agentService.getMetrics();
      else result = { error: "Unknown endpoint" };
      setResponse(JSON.stringify(result, null, 2));
    } catch (err) {
      setResponse(JSON.stringify({ error: String(err) }, null, 2));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glow-card p-4">
      <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">
        🧪 API Tester
      </h3>

      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {endpoints.map((ep) => (
            <button
              key={ep.path}
              onClick={() => setEndpoint(ep.path)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                endpoint === ep.path
                  ? "bg-primary-500 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              )}
            >
              <span className="font-mono">{ep.method}</span> {ep.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <code className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-sm font-mono text-slate-600 dark:text-slate-400">
            {endpoint}
          </code>
          <button
            onClick={handleExecute}
            disabled={loading}
            className="px-4 py-1.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {loading ? "Loading..." : "Execute"}
          </button>
        </div>

        {response && (
          <pre className="p-3 bg-slate-900 text-green-400 rounded-lg text-xs font-mono overflow-x-auto max-h-60 overflow-y-auto">
            {response}
          </pre>
        )}
      </div>
    </div>
  );
}
