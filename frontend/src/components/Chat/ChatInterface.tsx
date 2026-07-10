import { useChat } from "../../hooks/useChat";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { ToolExecutionView } from "./ToolExecutionView";

export function ChatInterface() {
  const { sendMessage, isLoading } = useChat();

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col overflow-hidden">
        <MessageList />
        <ToolExecutionView />
      </div>
      <MessageInput onSend={sendMessage} isLoading={isLoading} />
    </div>
  );
}
