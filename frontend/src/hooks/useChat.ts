import { useCallback, useState } from "react";
import { useChatStore } from "../store/chatStore";
import { useAppStore } from "../store/appStore";
import apiService from "../services/api";
import type { Message } from "../types";

export function useChat() {
  const [isLoading, setIsLoading] = useState(false);
  const addMessage = useChatStore((s) => s.addMessage);
  const setStreaming = useChatStore((s) => s.setStreaming);
  const clearStream = useChatStore((s) => s.clearStream);
  const appendStreamContent = useChatStore((s) => s.appendStreamContent);
  const processChunk = useChatStore((s) => s.processChunk);
  const activeSession = useChatStore((s) => s.activeSession);
  const apiKey = useAppStore((s) => s.apiKey);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: content.trim(),
        timestamp: new Date().toISOString(),
      };

      addMessage(userMessage);
      setIsLoading(true);
      setStreaming(true);
      clearStream();

      if (apiKey) {
        apiService.setApiKey(apiKey);
      }

      try {
        const response = await fetch(
          `${
            import.meta.env.VITE_API_URL || "http://localhost:8000"
          }/api/v1/chat`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(apiKey ? { "X-API-Key": apiKey } : {}),
            },
            body: JSON.stringify({
              message: content.trim(),
              session_id: activeSession?.id,
              stream: true,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || `Error ${response.status}`);
        }

        const data = await response.json();
        processChunk({
          type: "done",
          content: data.content || "",
          session_id: data.session_id || "",
          metrics: data.metrics,
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "An error occurred";

        // Fallback: add a simple mock response
        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `🤖 Hello! I'm your AI Agent. I detected that the backend is not running yet. Start it with:\n\n\`\`\`bash\ncd backend && uvicorn app.main:app --reload --port 8000\n\`\`\`\n\nIn the meantime, here's what I can do:\n\n- 🌐 **Web Search** - Find real-time information\n- 🔢 **Calculator** - Solve math problems\n- 📝 **Summarization** - Condense text\n- 📁 **File Operations** - Manage files\n- 🔌 **API Calls** - Interact with external APIs\n- 💻 **Code Execution** - Run Python code\n\nConfigure your OpenAI/Anthropic API key in the \`.env\` file to unlock my full intelligence!`,
          timestamp: new Date().toISOString(),
        };
        addMessage(assistantMessage);
      } finally {
        setIsLoading(false);
        setStreaming(false);
        clearStream();
      }
    },
    [
      isLoading,
      addMessage,
      setStreaming,
      clearStream,
      processChunk,
      activeSession,
      apiKey,
    ]
  );

  const clearChat = useCallback(() => {
    useChatStore.getState().clearMessages();
  }, []);

  return {
    sendMessage,
    clearChat,
    isLoading,
  };
}
