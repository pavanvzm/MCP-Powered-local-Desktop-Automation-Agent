import { useState } from "react";
import agentService from "../../services/agentService";
import { cn } from "../../lib/utils";

interface Tool {
  name: string;
  icon: string;
  description: string;
  params: Array<{ key: string; label: string; placeholder: string }>;
}

const tools: Tool[] = [
  {
    name: "calculator",
    icon: "🔢",
    description: "Evaluate mathematical expressions",
    params: [{ key: "expression", label: "Expression", placeholder: "e.g., 2 + 2 * 5" }],
  },
  {
    name: "datetime",
    icon: "⏰",
    description: "Get current date and time",
    params: [
      {
        key: "format",
        label: "Format",
        placeholder: "iso, readable, date, time, or unix",
      },
    ],
  },
  {
    name: "summarize",
    icon: "📝",
    description: "Summarize a text",
    params: [
      { key: "text", label: "Text", placeholder: "Enter text to summarize..." },
    ],
  },
];

export function ToolTester() {
  const [selectedTool, setSelectedTool] = useState(tools[0]);
  const [params, setParams] = useState<Record<string, string>>({});
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleExecute = async () => {
    setLoading(true);
    setResult("");
    try {
      const response = await agentService.executeTool(selectedTool.name, params);
      setResult(JSON.stringify(response, null, 2));
    } catch (err) {
      setResult(JSON.stringify({ error: String(err) }, null, 2));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glow-card p-4">
      <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">
        🔧 Tool Tester
      </h3>

      <div className="flex flex-wrap gap-2 mb-4">
        {tools.map((tool) => (
          <button
            key={tool.name}
            onClick={() => {
              setSelectedTool(tool);
              setParams({});
              setResult("");
            }}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
              selectedTool.name === tool.name
                ? "bg-primary-500 text-white"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
            )}
          >
            <span>{tool.icon}</span>
            {tool.name}
          </button>
        ))}
      </div>

      <div className="space-y-3 mb-4">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {selectedTool.description}
        </p>
        {selectedTool.params.map((param) => (
          <div key={param.key}>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              {param.label}
            </label>
            <input
              type="text"
              value={params[param.key] || ""}
              onChange={(e) =>
                setParams({ ...params, [param.key]: e.target.value })
              }
              placeholder={param.placeholder}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            />
          </div>
        ))}
        <button
          onClick={handleExecute}
          disabled={loading}
          className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          {loading ? "Executing..." : "Execute Tool"}
        </button>
      </div>

      {result && (
        <pre className="p-3 bg-slate-900 text-green-400 rounded-lg text-xs font-mono overflow-x-auto max-h-40 overflow-y-auto">
          {result}
        </pre>
      )}
    </div>
  );
}
