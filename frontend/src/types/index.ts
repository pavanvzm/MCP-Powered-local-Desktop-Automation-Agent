export type MessageRole = "user" | "assistant" | "system";

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface ToolDefinitionFunction {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface ToolDefinition {
  type: string;
  function: ToolDefinitionFunction;
}

export interface ToolResult {
  tool: string;
  success: boolean;
  result?: unknown;
  error?: string;
  call_id: string;
}

export interface AgentMetrics {
  total_queries: number;
  total_tool_calls: number;
  total_errors: number;
  avg_response_time_ms: number;
  tools_available: string[];
  memory_size: number;
  session_id: string;
  started_at: string;
}

export interface StreamChunk {
  type: "content" | "tool_calls_start" | "tool_result" | "error" | "done";
  content?: string;
  tool?: string;
  call_id?: string;
  result?: unknown;
  error?: string;
  error_type?: string;
  session_id: string;
  metrics?: AgentMetrics;
  count?: number;
  success?: boolean;
  llm_configured?: boolean;
}

export interface Session {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  message_count: number;
}

export interface HealthStatus {
  status: string;
  version: string;
  timestamp: string;
  services: Record<string, { status: string }>;
}

export interface Task {
  id: string;
  name: string;
  description?: string;
  status: "pending" | "running" | "completed" | "failed";
  priority: number;
  created_at: string;
  scheduled_at?: string;
  completed_at?: string;
  result?: unknown;
  error?: string;
}

export interface AppSettings {
  theme: "light" | "dark" | "system";
  fontSize: "sm" | "md" | "lg";
  streamingEnabled: boolean;
}

export type TabView = "chat" | "dashboard" | "playground";
