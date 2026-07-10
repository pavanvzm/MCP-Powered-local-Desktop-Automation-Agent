import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { cn } from "../../lib/utils";

interface MessageInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function MessageInput({ onSend, isLoading, disabled }: MessageInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSend = () => {
    if (!input.trim() || isLoading || disabled) return;
    onSend(input.trim());
    setInput("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Send a message... (Shift+Enter for new line)"
              rows={1}
              disabled={isLoading || disabled}
              className={cn(
                "w-full resize-none rounded-xl border border-slate-200 dark:border-slate-700",
                "bg-slate-50 dark:bg-slate-800",
                "px-4 py-3 pr-12 text-sm",
                "placeholder:text-slate-400 dark:placeholder:text-slate-500",
                "focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "transition-all"
              )}
            />
          </div>

          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading || disabled}
            className={cn(
              "flex-shrink-0 px-4 py-3 rounded-xl font-medium text-sm transition-all",
              "bg-primary-500 hover:bg-primary-600 active:bg-primary-700",
              "text-white disabled:opacity-50 disabled:cursor-not-allowed",
              "flex items-center gap-2"
            )}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span className="hidden sm:inline">Send</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </>
            )}
          </button>
        </div>

        <p className="mt-2 text-xs text-center text-slate-400 dark:text-slate-500">
          AI responses are generated. Check important information.
        </p>
      </div>
    </div>
  );
}
