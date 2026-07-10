import apiService from "./api";

interface RawToolDef {
  type: string;
  function: {
    name: string;
    description: string;
    parameters?: Record<string, unknown>;
  };
}

class AgentService {
  private activeSessions: Map<string, boolean> = new Map();

  async getTools(): Promise<RawToolDef[]> {
    const result = await apiService.listTools();
    return result.tools || [];
  }

  async getMetrics() {
    return apiService.getMetrics();
  }

  async getHealth() {
    return apiService.healthCheck();
  }

  async getConversationHistory(sessionId: string) {
    return apiService.getConversationHistory(sessionId);
  }

  async clearSession(sessionId: string) {
    this.activeSessions.delete(sessionId);
    return apiService.clearSession(sessionId);
  }

  async inspectMemory(sessionId: string, query?: string) {
    return apiService.inspectMemory(sessionId, query);
  }

  async executeTool(tool: string, parameters: Record<string, unknown>) {
    return apiService.executeTool(tool, parameters);
  }
}

export const agentService = new AgentService();
export default agentService;
