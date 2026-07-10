import { useEffect, useState } from "react";
import { useChatStore } from "../../store/chatStore";
import { useAppStore } from "../../store/appStore";
import { cn } from "../../lib/utils";
import type { AgentStatus } from "../../types";

export function OrchestratorPanel() {
  const orchestratorStatus = useChatStore((s) => s.orchestratorStatus);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/v1/orchestrator/status`
      );
      if (response.ok) {
        const data = await response.json();
        useChatStore.getState().setOrchestratorStatus(data);
      }
    } catch {
      // Demo data when offline
      useChatStore.getState().setOrchestratorStatus({
        agents: {
          researcher: { name: "researcher", specialization: "web research", is_busy: false, tasks_completed: 12 },
          analyst: { name: "analyst", specialization: "data analysis", is_busy: false, tasks_completed: 8 },
          writer: { name: "writer", specialization: "content creation", is_busy: false, tasks_completed: 15 },
          coder: { name: "coder", specialization: "code generation", is_busy: true, tasks_completed: 23 },
        },
        queue_size: 2,
      });
    } finally {
      setLoading(false);
    }
  };

  const agentIcons: Record<string, string> = {
    researcher: "🔬",
    analyst: "📊",
    writer: "✍️",
    coder: "💻",
  };

  if (loading) {
    return (
      <div className="glow-card p-4">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 bg-slate-200 dark:bg-slate-700 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const agents = orchestratorStatus?.agents || {};

  return (
    <div className="glow-card p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100">
          🧠 Multi-Agent Orchestrator
        </h3>
        <span className="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-800 rounded text-slate-500 dark:text-slate-400">
          Queue: {orchestratorStatus?.queue_size || 0}
        </span>
      </div>

      <div className="grid gap-3">
        {Object.keys(agents).length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">Agents not available</p>
        ) : (
          Object.entries(agents).map(([name, agent]: [string, AgentStatus]) => (
            <div
              key={name}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border transition-all",
                agent.is_busy
                  ? "bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800"
                  : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
              )}
            >
              <div className="text-2xl">{agentIcons[name] || "🤖"}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm capitalize text-slate-800 dark:text-slate-200">
                    {name}
                  </span>
                  <span className={cn(
                    "w-2 h-2 rounded-full",
                    agent.is_busy ? "bg-yellow-500 animate-pulse" : "bg-green-500"
                  )} />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {agent.specialization}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-primary-500">{agent.tasks_completed}</p>
                <p className="text-xs text-slate-400">tasks</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Send to orchestrator button */}
      <button
        onClick={() => useAppStore.getState().setActiveTab("chat")}
        className="mt-4 w-full px-4 py-2 bg-gradient-to-r from-primary-500 to-purple-600 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all"
      >
        🚀 Send Task to Orchestrator
      </button>
    </div>
  );
}
