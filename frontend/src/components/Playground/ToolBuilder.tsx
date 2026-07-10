import { useState } from "react";
import { useChatStore } from "../../store/chatStore";
import { cn } from "../../lib/utils";

export function ToolBuilder() {
  const customTools = useChatStore((s) => s.customTools);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [code, setCode] = useState(`# Write Python code for your tool
# Use 'params' dict for inputs
# Set 'result' with output
def run(params):
    name = params.get("name", "World")
    result = f"Hello, {name}!"
    return result
`);
  const [parameters, setParameters] = useState<Array<{ name: string; type: string; description: string; required: boolean }>>([
    { name: "name", type: "string", description: "Name to greet", required: true },
  ]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const addParameter = () => {
    setParameters([...parameters, { name: "", type: "string", description: "", required: false }]);
  };

  const updateParameter = (index: number, field: string, value: string | boolean) => {
    const updated = [...parameters];
    (updated[index] as Record<string, unknown>)[field] = value;
    setParameters(updated);
  };

  const removeParameter = (index: number) => {
    setParameters(parameters.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setMessage("⚠️ Tool name is required");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/v1/tools/custom`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, description, code, parameters }),
        }
      );
      if (response.ok) {
        setMessage("✅ Tool created successfully!");
        setName("");
        setDescription("");
        setCode("");
        setParameters([]);
      } else {
        const err = await response.json();
        setMessage(`❌ ${err.detail || "Failed to create tool"}`);
      }
    } catch {
      setMessage("⚠️ Backend offline. Tool definition saved locally.");
      const localTool = { id: crypto.randomUUID(), name, description, code, parameters, created_at: new Date().toISOString(), version: 1 };
      useChatStore.setState({ customTools: [...customTools, localTool] });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glow-card p-4">
      <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">
        🔧 Custom Tool Builder
      </h3>

      <div className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Tool Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., greet_user"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this tool do?"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            />
          </div>
        </div>

        {/* Parameters */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Parameters</label>
            <button onClick={addParameter} className="px-2 py-1 text-xs bg-primary-500 hover:bg-primary-600 text-white rounded transition-colors">+ Add</button>
          </div>
          <div className="space-y-2">
            {parameters.map((param, i) => (
              <div key={i} className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <input
                  type="text"
                  value={param.name}
                  onChange={(e) => updateParameter(i, "name", e.target.value)}
                  placeholder="param_name"
                  className="flex-1 px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none"
                />
                <select
                  value={param.type}
                  onChange={(e) => updateParameter(i, "type", e.target.value)}
                  className="px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option value="string">string</option>
                  <option value="integer">integer</option>
                  <option value="number">number</option>
                  <option value="boolean">boolean</option>
                </select>
                <label className="flex items-center gap-1 text-xs text-slate-500">
                  <input
                    type="checkbox"
                    checked={param.required}
                    onChange={(e) => updateParameter(i, "required", e.target.checked)}
                  />
                  required
                </label>
                <button onClick={() => removeParameter(i)} className="text-red-500 hover:text-red-700 text-xs px-1">✕</button>
              </div>
            ))}
          </div>
        </div>

        {/* Code */}
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
            Python Code <span className="text-slate-400">(use `params` dict, set `result`)</span>
          </label>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            rows={8}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-900 text-green-400 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary-500/50"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-gradient-to-r from-primary-500 to-purple-600 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all disabled:opacity-50"
        >
          {saving ? "Saving..." : "💾 Save Tool"}
        </button>

        {message && <p className="text-sm text-slate-600 dark:text-slate-400">{message}</p>}

        {/* Saved Tools */}
        {customTools.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Saved Tools</h4>
            <div className="space-y-1">
              {customTools.map((tool) => (
                <div key={tool.id} className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-sm">
                  <span className="font-medium text-slate-700 dark:text-slate-300">{tool.name}</span>
                  <span className="text-xs text-slate-400">v{tool.version}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
