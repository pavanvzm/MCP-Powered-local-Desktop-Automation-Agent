import { useEffect, useRef } from "react";
import { useChatStore } from "../store/chatStore";
import agentService from "../services/agentService";

export function useMetrics(pollInterval = 5000) {
  const setMetrics = useChatStore((s) => s.setMetrics);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const data = await agentService.getMetrics();
        if (data && typeof data === "object" && "active_sessions" in data) {
          // Extract first session metrics if available
          const sessions = (data as { sessions?: Record<string, unknown> }).sessions;
          if (sessions) {
            const firstSession = Object.values(sessions)[0];
            if (firstSession && typeof firstSession === "object") {
              setMetrics(firstSession as Parameters<typeof setMetrics>[0]);
            }
          }
        }
      } catch {
        // Backend not available, silently ignore
      }
    };

    fetchMetrics();
    intervalRef.current = setInterval(fetchMetrics, pollInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [setMetrics, pollInterval]);
}
