import { useState } from "react";
import { useChatStore } from "../../store/chatStore";
import { formatDate, generateSessionName } from "../../lib/utils";
import type { Session } from "../../types";

export function SessionManager() {
  const sessions = useChatStore((s) => s.sessions);
  const activeSession = useChatStore((s) => s.activeSession);
  const setActiveSession = useChatStore((s) => s.setActiveSession);
  const addSession = useChatStore((s) => s.addSession);
  const clearMessages = useChatStore((s) => s.clearMessages);

  const handleNewSession = () => {
    const newSession: Session = {
      id: crypto.randomUUID(),
      name: generateSessionName(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_active: true,
      message_count: 0,
    };
    addSession(newSession);
    setActiveSession(newSession);
    clearMessages();
  };

  const handleSelectSession = (session: Session) => {
    setActiveSession(session);
    clearMessages();
  };

  return (
    <div className="glow-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100">
          💬 Sessions
        </h3>
        <button
          onClick={handleNewSession}
          className="px-3 py-1.5 text-xs font-medium bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
        >
          + New
        </button>
      </div>

      <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-thin">
        {sessions.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">
            No sessions yet. Start a new chat.
          </p>
        ) : (
          sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => handleSelectSession(session)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                activeSession?.id === session.id
                  ? "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300"
                  : "hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-400"
              }`}
            >
              <div className="font-medium truncate">{session.name}</div>
              <div className="text-xs opacity-60 mt-0.5">
                {formatDate(session.created_at)} · {session.message_count} messages
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
