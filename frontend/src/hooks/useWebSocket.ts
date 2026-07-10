import { useEffect, useCallback } from "react";
import wsService from "../services/websocketService";
import { useAppStore } from "../store/appStore";
import { useChatStore } from "../store/chatStore";
import type { StreamChunk } from "../types";

export function useWebSocket() {
  const setConnectionStatus = useAppStore((s) => s.setConnectionStatus);
  const processChunk = useChatStore((s) => s.processChunk);
  const setStreaming = useChatStore((s) => s.setStreaming);

  useEffect(() => {
    const unsubStatus = wsService.onStatus((status) => {
      setConnectionStatus(status);
    });

    const unsubMessage = wsService.onMessage((data) => {
      const chunk = data as unknown as StreamChunk;
      if (chunk.type === "content" || chunk.type === "tool_calls_start") {
        setStreaming(true);
      }
      processChunk(chunk);
    });

    wsService.connect();

    return () => {
      unsubStatus();
      unsubMessage();
    };
  }, [setConnectionStatus, processChunk, setStreaming]);

  const sendMessage = useCallback((message: string) => {
    wsService.sendMessage(message);
  }, []);

  const reconnect = useCallback(() => {
    wsService.connect();
  }, []);

  return {
    sendMessage,
    reconnect,
    isConnected: wsService.isConnected,
  };
}
