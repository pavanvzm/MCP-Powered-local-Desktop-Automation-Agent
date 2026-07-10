import { useChatStore } from "../../store/chatStore";
import { cn } from "../../lib/utils";

const toolIcons: Record<string, string> = {
  web_search: "🌐",
  calculator: "🔢",
  datetime: "⏰",
  summarize: "📝",
  file_operations: "📁",
  api_call: "🔌",
  execute_code: "💻",
};

export function ToolExecutionView() {
  const toolCalls = useChatStore((s) => s.currentToolCalls);

  if (toolCalls.length === 0) return null;

  return (
    <div className="px-4 py-2 space-y-2">
      {toolCalls.map((tc, i) => (
        <div
          key={`${tc.tool}-${i}`}
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm animate-slide-up",
            tc.status === "running" && "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800",
            tc.status === "success" && "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800",
            tc.status === "error" && "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
          )}
        >
          <span className="text-base">{toolIcons[tc.tool] || "🔧"}</span>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-700 dark:text-slate-300 capitalize">
                {tc.tool.replace(/_/g, " ")}
              </span>
              {tc.status === "running" && (
                <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  Running...
                </span>
              )}
              {tc.status === "success" && (
                <span className="text-green-600 dark:text-green-400">✓ Done</span>
              )}
              {tc.status === "error" && (
                <span className="text-red-600 dark:text-red-400">✗ Failed</span>
              )}
            </div>

            {typeof tc.result === 'string' && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                {tc.result}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
