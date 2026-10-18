import { ChatSession, Message, Workspace, PromptTemplate, AppSettings } from '../types';

const BASE_URL = '/api';

const DEFAULT_WORKSPACES: Workspace[] = [
  {
    id: 'ws-general',
    name: 'General Assistant',
    description: 'All-purpose AI assistant for brainstorming, questions, and daily tasks.',
    icon: 'Sparkles',
    systemPrompt: 'You are NexusAI, an expert, thoughtful, and articulate AI assistant. Be direct, accurate, and structured.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ws-engineer',
    name: 'Full-Stack Architect',
    description: 'Senior software engineer specializing in clean code, TypeScript, scalable architecture, and debugging.',
    icon: 'Code2',
    systemPrompt: 'You are a staff-level full-stack engineer and software architect. Provide production-ready, clean, safe, and typed code with succinct explanations.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ws-research',
    name: 'Research & Synthesis',
    description: 'Deep analytical research, competitive synthesis, and executive summaries.',
    icon: 'BookOpen',
    systemPrompt: 'You are a senior analyst and researcher. Synthesize complex topics, highlight trade-offs, and cite logical reasoning.',
    createdAt: new Date().toISOString(),
  },
];

const DEFAULT_PROMPTS: PromptTemplate[] = [
  {
    id: 'p-1',
    title: 'Code Refactoring & Performance',
    description: 'Analyze code for bottlenecks, readability improvements, and modern patterns.',
    category: 'Coding',
    content: 'Review the following code for readability, performance bottlenecks, and adherence to SOLID principles:\n\n```\n// paste code here\n```\n\nProvide clear refactored alternatives.',
    tags: ['refactor', 'typescript', 'clean-code'],
  },
  {
    id: 'p-2',
    title: 'System Architecture Design',
    description: 'Design a distributed, highly available system architecture with trade-offs.',
    category: 'Coding',
    content: 'Design the end-to-end system architecture for [system requirement]. Include API endpoints, database schemas, caching layers, and security considerations.',
    tags: ['architecture', 'backend', 'scalability'],
  },
  {
    id: 'p-3',
    title: 'Bug Diagnosis & Root Cause Analysis',
    description: 'Isolate error stack traces and suggest exact fixes.',
    category: 'Coding',
    content: 'I encountered the following bug / error log:\n\n```\n// paste error log or code here\n```\n\nPlease diagnose the root cause, why it occurred, and provide the exact fix.',
    tags: ['debug', 'fix', 'troubleshooting'],
  },
  {
    id: 'p-4',
    title: 'Executive Briefing & Summary',
    description: 'Condense long articles or technical documents into actionable takeaways.',
    category: 'Productivity',
    content: 'Please summarize the following material into:\n1. Key Takeaways (bullet points)\n2. Strategic Implications\n3. Action Items\n\nMaterial:\n[paste text here]',
    tags: ['summary', 'management', 'action-items'],
  },
];

// LocalStorage helpers for standalone cloud deployment
function getLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`nexus_${key}`);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setLocal<T>(key: string, val: T): void {
  try {
    localStorage.setItem(`nexus_${key}`, JSON.stringify(val));
  } catch {}
}

export const api = {
  // Workspaces
  async getWorkspaces(): Promise<Workspace[]> {
    try {
      const res = await fetch(`${BASE_URL}/workspaces`);
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {}
    return getLocal<Workspace[]>('workspaces', DEFAULT_WORKSPACES);
  },

  async createWorkspace(data: { name: string; description: string; systemPrompt: string; icon?: string }): Promise<Workspace> {
    const newWs: Workspace = {
      id: `ws-${Date.now()}`,
      name: data.name,
      description: data.description,
      systemPrompt: data.systemPrompt,
      icon: data.icon || 'Layers',
      createdAt: new Date().toISOString(),
    };
    try {
      const res = await fetch(`${BASE_URL}/workspaces`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {}
    const list = getLocal<Workspace[]>('workspaces', DEFAULT_WORKSPACES);
    list.push(newWs);
    setLocal('workspaces', list);
    return newWs;
  },

  // Chats
  async getChats(workspaceId?: string): Promise<ChatSession[]> {
    try {
      const url = workspaceId ? `${BASE_URL}/chats?workspaceId=${workspaceId}` : `${BASE_URL}/chats`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {}
    const list = getLocal<ChatSession[]>('chats', [
      {
        id: 'chat-welcome',
        title: 'Welcome to Nexus 3D Studio',
        workspaceId: 'ws-general',
        model: 'gemini-3.8-flash',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messageCount: 1,
      },
    ]);
    return workspaceId ? list.filter((c) => c.workspaceId === workspaceId) : list;
  },

  async createChat(data: { title?: string; workspaceId: string; model: string }): Promise<ChatSession> {
    const newChat: ChatSession = {
      id: `chat-${Date.now()}`,
      title: data.title || 'New Chat',
      workspaceId: data.workspaceId,
      model: data.model || 'gemini-3.8-flash',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messageCount: 0,
    };
    try {
      const res = await fetch(`${BASE_URL}/chats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {}
    const list = getLocal<ChatSession[]>('chats', []);
    list.unshift(newChat);
    setLocal('chats', list);
    return newChat;
  },

  async updateChat(id: string, updates: Partial<ChatSession>): Promise<ChatSession> {
    try {
      const res = await fetch(`${BASE_URL}/chats/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {}
    const list = getLocal<ChatSession[]>('chats', []);
    const chat = list.find((c) => c.id === id);
    if (chat) {
      Object.assign(chat, updates);
      setLocal('chats', list);
      return chat;
    }
    return { ...updates, id } as ChatSession;
  },

  async deleteChat(id: string): Promise<void> {
    try {
      await fetch(`${BASE_URL}/chats/${id}`, { method: 'DELETE' });
    } catch {}
    const list = getLocal<ChatSession[]>('chats', []).filter((c) => c.id !== id);
    setLocal('chats', list);
  },

  // Messages
  async getMessages(chatId: string): Promise<Message[]> {
    try {
      const res = await fetch(`${BASE_URL}/chats/${chatId}/messages`);
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {}
    const msgs = getLocal<Message[]>(`messages_${chatId}`, [
      {
        id: 'msg-welcome',
        chatId: 'chat-welcome',
        role: 'assistant',
        content: 'Welcome to **Nexus 3D Intelligence Studio**! 🚀\n\nI am your interactive, voice-reactive AI companion. Try speaking to me using the **Microphone (🎙️)**, or test any question in the prompt box!',
        timestamp: new Date().toISOString(),
        model: 'gemini-3.8-flash',
      },
    ]);
    return msgs;
  },

  // Stream message (Backend proxy or Direct Google Gemini API)
  async streamMessage(
    chatId: string,
    content: string,
    model: string,
    onUserMessage: (msg: Message) => void,
    onChunk: (chunk: string) => void,
    onComplete: (fullMessage: Message) => void,
    onError: (err: any) => void
  ): Promise<void> {
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      chatId,
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
      tokens: Math.ceil(content.length / 4),
    };

    onUserMessage(userMessage);

    // Save user message locally
    const existingMsgs = getLocal<Message[]>(`messages_${chatId}`, []);
    existingMsgs.push(userMessage);
    setLocal(`messages_${chatId}`, existingMsgs);

    // Try backend proxy first
    let proxySucceeded = false;
    try {
      const response = await fetch(`${BASE_URL}/chats/${chatId}/messages/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, model }),
      });

      if (response.ok && response.body) {
        proxySucceeded = true;
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = '';
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const payload = JSON.parse(line.slice(6));
                if (payload.chunk) {
                  accumulated += payload.chunk;
                  onChunk(payload.chunk);
                }
                if (payload.done) {
                  const finalMsg: Message = {
                    id: `msg-${Date.now()}`,
                    chatId,
                    role: 'assistant',
                    content: payload.fullText || accumulated,
                    timestamp: new Date().toISOString(),
                    tokens: payload.tokens,
                    model: payload.model,
                  };
                  existingMsgs.push(finalMsg);
                  setLocal(`messages_${chatId}`, existingMsgs);
                  onComplete(finalMsg);
                  return;
                }
              } catch {}
            }
          }
        }
        return;
      }
    } catch {}

    // Fallback: Direct Google Gemini API streaming from browser
    if (!proxySucceeded) {
      const settings = await this.getSettings();
      const apiKey = settings.rawApiKey || settings.apiKey;

      if (apiKey && settings.provider === 'gemini') {
        try {
          const targetModel = 'gemini-3.8-flash';
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:streamGenerateContent?alt=sse&key=${apiKey}`;

          const allMsgs = existingMsgs.map((m) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
          }));

          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: allMsgs }),
          });

          if (!res.ok) {
            const err = await res.text();
            throw new Error(`Gemini API error: ${err}`);
          }

          const reader = res.body?.getReader();
          if (!reader) throw new Error('No stream available');

          const decoder = new TextDecoder();
          let accumulated = '';
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.startsWith('data: ')) {
                try {
                  const data = JSON.parse(trimmed.slice(6));
                  const parts = data.candidates?.[0]?.content?.parts || [];
                  for (const p of parts) {
                    if (p.text) {
                      accumulated += p.text;
                      onChunk(p.text);
                    }
                  }
                } catch {}
              }
            }
          }

          const finalMsg: Message = {
            id: `msg-${Date.now()}`,
            chatId,
            role: 'assistant',
            content: accumulated,
            timestamp: new Date().toISOString(),
            tokens: Math.ceil(accumulated.length / 4),
            model: 'gemini-3.8-flash',
          };
          existingMsgs.push(finalMsg);
          setLocal(`messages_${chatId}`, existingMsgs);
          onComplete(finalMsg);
          return;
        } catch (geminiErr: any) {
          console.error('Direct Gemini error:', geminiErr);
        }
      }

      // Built-in intelligent simulator fallback if offline / no key
      let simulatedResponse = `Hello there! I'm NexusAI, your 3D interactive intelligence.\n\nYou asked: "${content}"\n\nI am currently operating in high-speed local mode. You can add your Google Gemini API key anytime in **Settings & API** to unlock live neural reasoning!`;
      if (/^(hi|hello|hey)\b/i.test(content.trim())) {
        simulatedResponse = `Hello there! 👋 Welcome to NexusAI Studio.\n\nI'm your 3D interactive AI assistant. What would you like to work on today?`;
      }

      const words = simulatedResponse.split(' ');
      for (let i = 0; i < words.length; i++) {
        const chunk = (i === 0 ? '' : ' ') + words[i];
        onChunk(chunk);
        await new Promise((r) => setTimeout(r, 20));
      }

      const finalMsg: Message = {
        id: `msg-${Date.now()}`,
        chatId,
        role: 'assistant',
        content: simulatedResponse,
        timestamp: new Date().toISOString(),
        tokens: Math.ceil(simulatedResponse.length / 4),
        model: 'nexus-simulator',
      };
      existingMsgs.push(finalMsg);
      setLocal(`messages_${chatId}`, existingMsgs);
      onComplete(finalMsg);
    }
  },

  // Prompts
  async getPrompts(): Promise<PromptTemplate[]> {
    try {
      const res = await fetch(`${BASE_URL}/prompts`);
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {}
    return getLocal<PromptTemplate[]>('prompts', DEFAULT_PROMPTS);
  },

  async createPrompt(prompt: Omit<PromptTemplate, 'id'>): Promise<PromptTemplate> {
    const newP: PromptTemplate = { ...prompt, id: `p-${Date.now()}` };
    try {
      const res = await fetch(`${BASE_URL}/prompts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prompt),
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {}
    const list = getLocal<PromptTemplate[]>('prompts', DEFAULT_PROMPTS);
    list.push(newP);
    setLocal('prompts', list);
    return newP;
  },

  async deletePrompt(id: string): Promise<void> {
    try {
      await fetch(`${BASE_URL}/prompts/${id}`, { method: 'DELETE' });
    } catch {}
    const list = getLocal<PromptTemplate[]>('prompts', DEFAULT_PROMPTS).filter((p) => p.id !== id);
    setLocal('prompts', list);
  },

  // Settings
  async getSettings(): Promise<AppSettings & { rawApiKey?: string }> {
    try {
      const res = await fetch(`${BASE_URL}/settings`);
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {}
    return getLocal<AppSettings & { rawApiKey?: string }>('settings', {
      provider: 'gemini',
      defaultModel: 'gemini-3.8-flash',
      temperature: 0.7,
      maxTokens: 2048,
      hasApiKey: false,
      apiKey: '',
      rawApiKey: '',
    });
  },

  async updateSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
    try {
      const res = await fetch(`${BASE_URL}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {}
    const current = await this.getSettings();
    const updated = {
      ...current,
      ...settings,
      hasApiKey: Boolean(settings.apiKey || current.rawApiKey),
      rawApiKey: settings.apiKey || current.rawApiKey,
      apiKey: settings.apiKey
        ? `${settings.apiKey.slice(0, 4)}••••••••${settings.apiKey.slice(-4)}`
        : current.apiKey,
    };
    setLocal('settings', updated);
    return updated;
  },
};
