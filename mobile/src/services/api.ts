const API_URL = 'http://localhost:8000';

class MobileApiService {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = API_URL;
    this.apiKey = '';
  }

  setApiKey(key: string) { this.apiKey = key; }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.apiKey) headers['X-API-Key'] = this.apiKey;
    const response = await fetch(`${this.baseUrl}${endpoint}`, { ...options, headers });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }

  async healthCheck() { return this.request<{status: string; version: string}>(`/api/v1/health`); }
  async sendMessage(message: string, sessionId?: string) {
    return this.request<{content: string; session_id: string}>(`/api/v1/chat`, {
      method: 'POST', body: JSON.stringify({ message, session_id: sessionId, stream: false }),
    });
  }
  async listTools() { return this.request<{tools: Array<Record<string, unknown>>}>(`/api/v1/tools`); }
  async getMetrics() { return this.request(`/api/v1/metrics`); }
  async speechToText(audioUri: string) {
    // Will use native module for voice
    return { text: 'voice input placeholder' };
  }
}

export const mobileApi = new MobileApiService();
