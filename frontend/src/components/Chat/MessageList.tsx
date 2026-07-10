import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useChatStore } from "../../store/chatStore";
import { cn } from "../../lib/utils";
import type { Message } from "../../types";

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex w-full animate-slide-up",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <div className="flex-shrink-0 mr-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
            AI
          </div>
        </div>
      )}
      <div
        className={cn(
          "message-bubble",
          isUser
            ? "bg-primary-500 text-white rounded-br-md"
            : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-md border border-slate-200 dark:border-slate-700"
        )}
      >
        {isUser ? (
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown
              components={{
                code({ className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || "");
                  const inline = !match;
                  return !inline ? (
                    <SyntaxHighlighter
                      style={oneDark}
                      language={match[1]}
                      PreTag="div"
                      customStyle={{
                        margin: 0,
                        borderRadius: "0.5rem",
                        fontSize: "0.8rem",
                      }}
                    >
                      {String(children).replace(/\n$/, "")}
                    </SyntaxHighlighter>
                  ) : (
                    <code
                      className="bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-sm"
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
                p({ children }) {
                  return <p className="text-sm leading-relaxed mb-2 last:mb-0">{children}</p>;
                },
                ul({ children }) {
                  return <ul className="list-disc pl-4 mb-2 text-sm space-y-1">{children}</ul>;
                },
                ol({ children }) {
                  return <ol className="list-decimal pl-4 mb-2 text-sm space-y-1">{children}</ol>;
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
      {isUser && (
        <div className="flex-shrink-0 ml-3">
          <div className="w-8 h-8 rounded-lg bg-slate-300 dark:bg-slate-600 flex items-center justify-center text-white text-xs font-bold">
            U
          </div>
        </div>
      )}
    </div>
  );
}

export function MessageList() {
  const messages = useChatStore((s) => s.messages);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const streamingContent = useChatStore((s) => s.streamingContent);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  if (messages.length === 0 && !isStreaming) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6 animate-float">🤖</div>
          <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">
            AI Agent Ready
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">
            Send a message to start the conversation. I can search the web,
            calculate math, execute code, and more!
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {[
              { icon: "🌐", label: "Search the web" },
              { icon: "🔢", label: "Calculate math" },
              { icon: "💻", label: "Execute code" },
              { icon: "📝", label: "Summarize text" },
            ].map((suggestion) => (
              <span
                key={suggestion.label}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-medium"
              >
                <span>{suggestion.icon}</span>
                {suggestion.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4"
    >
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}

      {isStreaming && streamingContent && (
        <div className="flex w-full animate-fade-in">
          <div className="flex-shrink-0 mr-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
              AI
            </div>
          </div>
          <div className="message-bubble bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-md border border-slate-200 dark:border-slate-700">
            <p className="text-sm whitespace-pre-wrap">{streamingContent}</p>
            <span className="inline-flex ml-1">
              <span className="typing-indicator">
                <span className="animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="animate-bounce" style={{ animationDelay: "300ms" }} />
              </span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
