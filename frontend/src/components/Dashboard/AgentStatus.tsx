import { useEffect, useState } from "react";
import agentService from "../../services/agentService";

export function AgentStatus() {
  const [health, setHealth] = useState<{ status: string; version: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const check = async () => {
      try {
        const data = await agentService.getHealth();
        setHealth(data);
      } catch {
        setHealth({ status: "offline", version: "unknown" });
      } finally {
        setLoading(false);
      }
    };
    check();
    const interval = setInterval(check, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="glow-card p-4">
        <div className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-slate-200 dark:bg-slate-700 h-10 w-10" />
          <div className="flex-1 space-y-2 py-1">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  const isOnline = health?.status === "healthy";

  return (
    <div className="glow-card p-4">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${isOnline ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"}`}>
            {isOnline ? "✅" : "❌"}
          </div>
          <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-slate-800 ${isOnline ? "bg-green-500" : "bg-red-500"}`} />
        </div>
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">
            Agent Status
          </h3>
          <p className={`text-sm ${isOnline ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
            {isOnline ? "Online & Ready" : "Offline"}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            v{health?.version || "1.0.0"}
          </p>
        </div>
      </div>
    </div>
  );
}
