const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

class ApiService {
  private baseUrl: string;
  private apiKey: string | null;

  constructor() {
    this.baseUrl = API_BASE_URL;
    this.apiKey = null;
  }

  setApiKey(key: string) {
    this.apiKey = key;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (this.apiKey) {
      headers["X-API-Key"] = this.apiKey;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // Health
  async healthCheck() {
    return this.request<{
      status: string;
      version: string;
      timestamp: string;
      services: Record<string, { status: string }>;
    }>("/api/v1/health");
  }

  // Tools
  async listTools() {
    return this.request<{ tools: Array<{ type: string; function: { name: string; description: string } }>; count: number }>("/api/v1/tools");
  }

  async executeTool(tool: string, parameters: Record<string, unknown> = {}) {
    return this.request("/api/v1/tools/execute", {
      method: "POST",
      body: JSON.stringify({ tool, parameters }),
    });
  }

  // Chat
  async sendMessage(message: string, sessionId?: string, stream = true) {
    return this.request<{ type: string; content: string; session_id: string }>("/api/v1/chat", {
      method: "POST",
      body: JSON.stringify({ message, session_id: sessionId, stream }),
    });
  }

  async getConversationHistory(sessionId: string, limit = 50) {
    return this.request<{ session_id: string; messages: Array<{ role: string; content: string }>; count: number }>(
      `/api/v1/chat/${sessionId}?limit=${limit}`
    );
  }

  async clearSession(sessionId: string) {
    return this.request<{ session_id: string; status: string }>(`/api/v1/chat/${sessionId}`, {
      method: "DELETE",
    });
  }

  // Memory
  async inspectMemory(sessionId: string, query?: string) {
    const qs = query ? `?query=${encodeURIComponent(query)}` : "";
    return this.request(`/api/v1/memory/${sessionId}${qs}`);
  }

  async storeMemory(sessionId: string, text: string, metadata?: Record<string, unknown>) {
    return this.request(`/api/v1/memory/${sessionId}`, {
      method: "POST",
      body: JSON.stringify({ text, metadata }),
    });
  }

  // Metrics
  async getMetrics() {
    return this.request("/api/v1/metrics");
  }

  // Tasks
  async createTask(task: { name: string; description?: string; priority?: number }) {
    return this.request("/api/v1/tasks", {
      method: "POST",
      body: JSON.stringify(task),
    });
  }

  async getTask(taskId: string) {
    return this.request(`/api/v1/tasks/${taskId}`);
  }
}

export const apiService = new ApiService();
export default apiService;
