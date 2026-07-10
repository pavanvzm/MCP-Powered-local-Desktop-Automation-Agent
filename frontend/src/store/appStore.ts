import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AppSettings, TabView, VoiceState } from "../types";

interface AppState {
  // Theme
  theme: "light" | "dark" | "system";
  resolvedTheme: "light" | "dark";

  // Navigation
  activeTab: TabView;

  // Settings
  settings: AppSettings;

  // API Key
  apiKey: string | null;
  isApiKeySet: boolean;

  // Connection
  isConnected: boolean;
  connectionStatus: "connected" | "disconnected" | "reconnecting" | "error";

  // Voice
  voice: VoiceState;
  setVoiceState: (state: Partial<VoiceState>) => void;

  // Feature flags
  featureVoiceEnabled: boolean;
  featurePluginsEnabled: boolean;
  featureMultiAgentEnabled: boolean;

  // Actions
  setTheme: (theme: "light" | "dark" | "system") => void;
  setActiveTab: (tab: TabView) => void;
  setApiKey: (key: string | null) => void;
  setConnectionStatus: (status: "connected" | "disconnected" | "reconnecting" | "error") => void;
  applyTheme: () => void;
}

const getSystemTheme = (): "light" | "dark" => {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

const resolveTheme = (theme: "light" | "dark" | "system"): "light" | "dark" => {
  if (theme === "system") return getSystemTheme();
  return theme;
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      theme: "dark",
      resolvedTheme: "dark",
      activeTab: "chat",
      settings: {
        theme: "dark",
        fontSize: "md",
        streamingEnabled: true,
      },
      apiKey: null,
      isApiKeySet: false,
      isConnected: false,
      connectionStatus: "disconnected",

      voice: {
        isListening: false,
        isSpeaking: false,
        transcript: "",
        isSupported: typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window),
      },

      featureVoiceEnabled: true,
      featurePluginsEnabled: true,
      featureMultiAgentEnabled: true,

      setVoiceState: (state) =>
        set((prev) => ({ voice: { ...prev.voice, ...state } })),

      setTheme: (theme) => {
        const resolvedTheme = resolveTheme(theme);
        set({ theme, resolvedTheme, settings: { ...get().settings, theme } });
        get().applyTheme();
      },

      setActiveTab: (tab) => set({ activeTab: tab }),

      setApiKey: (key) => set({ apiKey: key, isApiKeySet: !!key }),

      setConnectionStatus: (status) =>
        set({
          connectionStatus: status,
          isConnected: status === "connected",
        }),

      applyTheme: () => {
        const { resolvedTheme } = get();
        const root = document.documentElement;
        if (resolvedTheme === "dark") {
          root.classList.add("dark");
        } else {
          root.classList.remove("dark");
        }
      },
    }),
    {
      name: "ai-agent-store",
      partialize: (state) => ({
        theme: state.theme,
        settings: state.settings,
        apiKey: state.apiKey,
        isApiKeySet: state.isApiKeySet,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.applyTheme();
        }
      },
    }
  )
);
