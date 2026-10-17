import { ChatSession, Message, Workspace, PromptTemplate, AppSettings } from '../types';

const BASE_URL = '/api';

export const api = {
  // Workspaces
  async getWorkspaces(): Promise<Workspace[]> {
    const res = await fetch(`${BASE_URL}/workspaces`);
    const json = await res.json();
    return json.data;
  },

  async createWorkspace(data: { name: string; description: string; systemPrompt: string; icon?: string }): Promise<Workspace> {
    const res = await fetch(`${BASE_URL}/workspaces`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    return json.data;
  },

  // Chats
  async getChats(workspaceId?: string): Promise<ChatSession[]> {
    const url = workspaceId ? `${BASE_URL}/chats?workspaceId=${workspaceId}` : `${BASE_URL}/chats`;
    const res = await fetch(url);
    const json = await res.json();
    return json.data;
  },

  async createChat(data: { title?: string; workspaceId: string; model: string }): Promise<ChatSession> {
    const res = await fetch(`${BASE_URL}/chats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    return json.data;
  },

  async updateChat(id: string, updates: Partial<ChatSession>): Promise<ChatSession> {
    const res = await fetch(`${BASE_URL}/chats/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const json = await res.json();
    return json.data;
  },

  async deleteChat(id: string): Promise<void> {
    await fetch(`${BASE_URL}/chats/${id}`, { method: 'DELETE' });
  },

  // Messages
  async getMessages(chatId: string): Promise<Message[]> {
    const res = await fetch(`${BASE_URL}/chats/${chatId}/messages`);
    const json = await res.json();
    return json.data;
  },

  // Stream message
  async streamMessage(
    chatId: string,
    content: string,
    model: string,
    onUserMessage: (msg: Message) => void,
    onChunk: (chunk: string) => void,
    onComplete: (fullMessage: Message) => void,
    onError: (err: any) => void
  ): Promise<void> {
    try {
      const response = await fetch(`${BASE_URL}/chats/${chatId}/messages/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, model }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No readable stream available');

      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const payload = JSON.parse(line.slice(6));

              if (payload.userMessage) {
                onUserMessage(payload.userMessage);
              }

              if (payload.chunk) {
                accumulated += payload.chunk;
                onChunk(payload.chunk);
              }

              if (payload.done) {
                onComplete({
                  id: `msg-${Date.now()}`,
                  chatId,
                  role: 'assistant',
                  content: payload.fullText || accumulated,
                  timestamp: new Date().toISOString(),
                  tokens: payload.tokens,
                  model: payload.model,
                });
              }

              if (payload.error) {
                onError(new Error(payload.error));
              }
            } catch {
              // Ignore line parsing errors on partial chunks
            }
          }
        }
      }
    } catch (err) {
      onError(err);
    }
  },

  // Prompts
  async getPrompts(): Promise<PromptTemplate[]> {
    const res = await fetch(`${BASE_URL}/prompts`);
    const json = await res.json();
    return json.data;
  },

  async createPrompt(prompt: Omit<PromptTemplate, 'id'>): Promise<PromptTemplate> {
    const res = await fetch(`${BASE_URL}/prompts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prompt),
    });
    const json = await res.json();
    return json.data;
  },

  async deletePrompt(id: string): Promise<void> {
    await fetch(`${BASE_URL}/prompts/${id}`, { method: 'DELETE' });
  },

  // Settings
  async getSettings(): Promise<AppSettings> {
    const res = await fetch(`${BASE_URL}/settings`);
    const json = await res.json();
    return json.data;
  },

  async updateSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
    const res = await fetch(`${BASE_URL}/settings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    const json = await res.json();
    return json.data;
  },
};
