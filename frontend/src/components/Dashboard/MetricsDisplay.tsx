import { useChatStore } from "../../store/chatStore";
import { formatTime } from "../../lib/utils";

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: string;
  color: string;
}

function MetricCard({ label, value, icon, color }: MetricCardProps) {
  return (
    <div className="glow-card p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${color}`}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {value}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
        </div>
      </div>
    </div>
  );
}

export function MetricsDisplay() {
  const metrics = useChatStore((s) => s.metrics);

  if (!metrics) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Queries", value: "-", icon: "💬", color: "bg-blue-100 dark:bg-blue-900/30" },
          { label: "Tool Calls", value: "-", icon: "🔧", color: "bg-purple-100 dark:bg-purple-900/30" },
          { label: "Avg Response", value: "-", icon: "⚡", color: "bg-cyan-100 dark:bg-cyan-900/30" },
          { label: "Tools Available", value: "7", icon: "🧰", color: "bg-green-100 dark:bg-green-900/30" },
        ].map((m) => (
          <MetricCard key={m.label} {...m} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <MetricCard
        label="Total Queries"
        value={metrics.total_queries}
        icon="💬"
        color="bg-blue-100 dark:bg-blue-900/30"
      />
      <MetricCard
        label="Tool Calls"
        value={metrics.total_tool_calls}
        icon="🔧"
        color="bg-purple-100 dark:bg-purple-900/30"
      />
      <MetricCard
        label="Avg Response"
        value={formatTime(metrics.avg_response_time_ms)}
        icon="⚡"
        color="bg-cyan-100 dark:bg-cyan-900/30"
      />
      <MetricCard
        label="Tools Available"
        value={metrics.tools_available?.length || 7}
        icon="🧰"
        color="bg-green-100 dark:bg-green-900/30"
      />
    </div>
  );
}
