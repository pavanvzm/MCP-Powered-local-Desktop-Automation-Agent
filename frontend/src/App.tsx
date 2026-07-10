import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navigation } from "./components/Common/Navigation";
import { ErrorBoundary } from "./components/Common/ErrorBoundary";
import { ChatInterface } from "./components/Chat/ChatInterface";
import { MetricsDisplay } from "./components/Dashboard/MetricsDisplay";
import { AgentStatus } from "./components/Dashboard/AgentStatus";
import { SessionManager } from "./components/Dashboard/SessionManager";
import { MemoryVisualizer } from "./components/Dashboard/MemoryVisualizer";
import { PluginManager } from "./components/Dashboard/PluginManager";
import { OrchestratorPanel } from "./components/Dashboard/OrchestratorPanel";
import { APITester } from "./components/Playground/APITester";
import { ToolTester } from "./components/Playground/ToolTester";
import { ToolBuilder } from "./components/Playground/ToolBuilder";
import { useMetrics } from "./hooks/useMetrics";
import { useAppStore } from "./store/appStore";
import { useChatStore } from "./store/chatStore";
import { cn } from "./lib/utils";

/* ───────── Landing Page ───────── */
function LandingPage({ onGetStarted }: { onGetStarted: () => void }) {
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);

  useEffect(() => {
    if (theme === "dark") setTheme("dark");
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 via-purple-500 to-cyan-500 flex items-center justify-center text-white font-bold shadow-lg shadow-primary-500/25">AI</div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary-600 via-purple-600 to-cyan-600 dark:from-primary-400 dark:via-purple-400 dark:to-cyan-400 bg-clip-text text-transparent">AgentOS</span>
            </div>
            <div className="flex items-center gap-4">
              <a href="https://github.com/pavanvzm/MCP-Powered-local-Desktop-Automation-Agent" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
                <span className="hidden sm:inline">GitHub</span>
              </a>
              <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400">{theme === "dark" ? "☀️" : "🌙"}</button>
            </div>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary-500/10 to-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-primary-500/5 via-purple-500/5 to-cyan-500/5 rounded-full blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300 text-sm font-medium mb-8">
              <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />Production-Grade AI Agent System
            </motion.div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
              <span className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-slate-200 dark:to-white bg-clip-text text-transparent">Intelligent</span><br />
              <span className="gradient-text">AI Agent Platform</span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-500 dark:text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed">
              Voice-enabled AI agent with multi-agent orchestration, custom tools, plugin system, and semantic memory visualization.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onGetStarted} className="px-8 py-4 bg-gradient-to-r from-primary-500 to-purple-600 hover:from-primary-600 hover:to-purple-700 text-white rounded-2xl font-semibold text-lg shadow-xl shadow-primary-500/25 hover:shadow-primary-500/40 transition-all">🚀 Launch Demo</motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="features" className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4"><span className="gradient-text">All 6 Features Built</span></h2>
            <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">The complete roadmap implemented</p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: "🎤", title: "Voice Interface", desc: "Speech-to-text input and text-to-speech output using Web Speech API.", color: "from-blue-500 to-cyan-500" },
              { icon: "🔧", title: "Custom Tools", desc: "Visual tool builder to create and register your own Python tools.", color: "from-purple-500 to-pink-500" },
              { icon: "🧠", title: "Multi-Agent", desc: "Supervisor + sub-agent orchestration for complex task decomposition.", color: "from-green-500 to-emerald-500" },
              { icon: "🧠", title: "Memory Viz", desc: "Semantic memory visualization with relevance scoring and search.", color: "from-orange-500 to-amber-500" },
              { icon: "🧩", title: "Plugin System", desc: "Plugin registry with lifecycle hooks and auto-discovery.", color: "from-red-500 to-rose-500" },
              { icon: "📱", title: "Mobile App", desc: "React Native app with shared API (APK build ready).", color: "from-indigo-500 to-violet-500" },
            ].map((f) => (
              <motion.div key={f.title} whileHover={{ y: -5 }} className="glow-card p-6 group cursor-pointer">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center text-2xl mb-4 shadow-lg`}>{f.icon}</div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <h2 className="text-3xl md:text-4xl font-bold mb-8"><span className="gradient-text">Ready to Build?</span></h2>
            <button onClick={onGetStarted} className="px-8 py-4 bg-gradient-to-r from-primary-500 to-purple-600 text-white rounded-2xl font-semibold shadow-xl hover:shadow-2xl transition-all">🎯 Live Demo</button>
          </motion.div>
        </div>
      </section>

      <footer className="border-t border-slate-200 dark:border-slate-800 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-slate-400 dark:text-slate-500">
          <p>Built with ❤️ | AI Agent Production System v2.0.0</p>
        </div>
      </footer>
    </div>
  );
}

/* ───────── Demo App ───────── */
function DemoApp() {
  const activeTab = useAppStore((s) => s.activeTab);
  useMetrics(5000);

  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
      <Navigation />
      <div className="flex-1 flex overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === "chat" && (
            <motion.div key="chat" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col overflow-hidden">
              <ChatInterface />
            </motion.div>
          )}
          {activeTab === "dashboard" && (
            <motion.div key="dashboard" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
              <MetricsDisplay />
              <div className="grid md:grid-cols-2 gap-4">
                <AgentStatus />
                <SessionManager />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <OrchestratorPanel />
                <PluginManager />
              </div>
            </motion.div>
          )}
          {activeTab === "playground" && (
            <motion.div key="playground" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
              <APITester />
              <ToolTester />
            </motion.div>
          )}
          {activeTab === "tools" && (
            <motion.div key="tools" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="flex-1 overflow-y-auto p-4 md:p-6">
              <ToolBuilder />
            </motion.div>
          )}
          {activeTab === "memory" && (
            <motion.div key="memory" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="flex-1 overflow-y-auto p-4 md:p-6 max-w-3xl mx-auto w-full">
              <MemoryVisualizer />
            </motion.div>
          )}
          {activeTab === "plugins" && (
            <motion.div key="plugins" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="flex-1 overflow-y-auto p-4 md:p-6 max-w-3xl mx-auto w-full">
              <PluginManager />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function App() {
  const [showDemo, setShowDemo] = useState(false);
  const theme = useAppStore((s) => s.theme);
  useEffect(() => { useAppStore.getState().applyTheme(); }, [theme]);
  if (showDemo) return <ErrorBoundary><DemoApp /></ErrorBoundary>;
  return <LandingPage onGetStarted={() => setShowDemo(true)} />;
}
