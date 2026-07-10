import { create } from "zustand";
import type { Message, Session, StreamChunk, AgentMetrics, CustomToolDef, PluginDef, MemoryNode, OrchestratorStatus } from "../types";

interface ChatState {
  // Messages
  messages: Message[];
  isStreaming: boolean;
  streamingContent: string;
  currentToolCalls: Array<{ tool: string; status: "running" | "success" | "error"; result?: unknown }>;

  // Session
  activeSession: Session | null;
  sessions: Session[];

  // Metrics
  metrics: AgentMetrics | null;

  // Custom Tools
  customTools: CustomToolDef[];
  setCustomTools: (tools: CustomToolDef[]) => void;

  // Plugins
  plugins: PluginDef[];

  // Memory Visualization
  memoryNodes: MemoryNode[];

  // Orchestrator
  orchestratorStatus: OrchestratorStatus | null;

  // Actions
  addMessage: (message: Message) => void;
  setStreaming: (streaming: boolean) => void;
  appendStreamContent: (content: string) => void;
  clearStream: () => void;
  addToolCall: (tool: string) => void;
  updateToolCall: (tool: string, status: "success" | "error", result?: unknown) => void;
  clearToolCalls: () => void;
  setActiveSession: (session: Session | null) => void;
  addSession: (session: Session) => void;
  removeSession: (sessionId: string) => void;
  setMetrics: (metrics: AgentMetrics) => void;
  clearMessages: () => void;
  processChunk: (chunk: StreamChunk) => void;
  setPlugins: (plugins: PluginDef[]) => void;
  setMemoryNodes: (nodes: MemoryNode[]) => void;
  setOrchestratorStatus: (status: OrchestratorStatus) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isStreaming: false,
  streamingContent: "",
  currentToolCalls: [],
  activeSession: null,
  sessions: [],
  metrics: null,
  customTools: [],
  plugins: [],
  memoryNodes: [],
  orchestratorStatus: null,

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  setStreaming: (streaming) => set({ isStreaming: streaming }),

  appendStreamContent: (content) =>
    set((state) => ({ streamingContent: state.streamingContent + content })),

  clearStream: () => set({ streamingContent: "" }),

  addToolCall: (tool) =>
    set((state) => ({
      currentToolCalls: [
        ...state.currentToolCalls,
        { tool, status: "running" },
      ],
    })),

  updateToolCall: (tool, status, result) =>
    set((state) => ({
      currentToolCalls: state.currentToolCalls.map((tc) =>
        tc.tool === tool ? { ...tc, status, result } : tc
      ),
    })),

  clearToolCalls: () => set({ currentToolCalls: [] }),

  setActiveSession: (session) => set({ activeSession: session }),

  addSession: (session) =>
    set((state) => ({ sessions: [...state.sessions, session] })),

  removeSession: (sessionId) =>
    set((state) => ({
      sessions: state.sessions.filter((s) => s.id !== sessionId),
      activeSession:
        state.activeSession?.id === sessionId ? null : state.activeSession,
    })),

  setMetrics: (metrics) => set({ metrics }),

  clearMessages: () => set({ messages: [], streamingContent: "" }),

  setCustomTools: (tools) => set({ customTools: tools }),
  setPlugins: (plugins) => set({ plugins }),
  setMemoryNodes: (nodes) => set({ memoryNodes: nodes }),
  setOrchestratorStatus: (status) => set({ orchestratorStatus: status }),

  processChunk: (chunk: StreamChunk) => {
    const state = get();

    switch (chunk.type) {
      case "content":
        set({ streamingContent: state.streamingContent + (chunk.content || "") });
        break;

      case "tool_calls_start":
        set({ currentToolCalls: [] });
        break;

      case "tool_result":
        set({
          currentToolCalls: [
            ...state.currentToolCalls,
            {
              tool: chunk.tool || "",
              status: chunk.success ? "success" : "error",
              result: chunk.result || chunk.error,
            },
          ],
        });
        break;

      case "error":
        set({
          messages: [
            ...state.messages,
            {
              id: crypto.randomUUID(),
              role: "assistant",
              content: `Error: ${chunk.content || chunk.error || "Unknown error"}`,
              timestamp: new Date().toISOString(),
            },
          ],
          isStreaming: false,
          streamingContent: "",
        });
        break;

      case "done":
        const finalContent = chunk.content || state.streamingContent;
        if (finalContent) {
          set({
            messages: [
              ...state.messages,
              {
                id: crypto.randomUUID(),
                role: "assistant",
                content: finalContent,
                timestamp: new Date().toISOString(),
              },
            ],
            isStreaming: false,
            streamingContent: "",
            currentToolCalls: [],
            metrics: chunk.metrics || state.metrics,
          });
        }
        break;
    }
  },
}));
