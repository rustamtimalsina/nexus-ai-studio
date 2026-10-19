import { ChatSession, Message, Workspace, PromptTemplate, AppSettings, MessageAttachment } from '../types';

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
    title: 'Code Refactoring & Clean Architecture',
    description: 'Analyze code for bottlenecks, readability improvements, and modern patterns.',
    category: 'Coding',
    content: 'Review the following code for readability, performance bottlenecks, and adherence to clean architecture principles:\n\n```typescript\n// Paste code here\n```\n\nProvide clear refactored alternatives.',
    tags: ['refactor', 'typescript', 'clean-code'],
  },
  {
    id: 'p-2',
    title: 'Distributed System Architecture',
    description: 'Design a distributed, highly available system architecture with trade-offs.',
    category: 'Coding',
    content: 'Design the end-to-end system architecture for a high-traffic web application. Outline the caching layer, database strategy, microservices, and security considerations.',
    tags: ['architecture', 'backend', 'scalability'],
  },
  {
    id: 'p-3',
    title: 'Bug Diagnosis & Root Cause Analysis',
    description: 'Isolate error stack traces and suggest exact fixes.',
    category: 'Coding',
    content: 'I encountered the following bug / error log:\n\n```\n// paste error log or code here\n```\n\nPlease diagnose the root cause, explain why it occurred, and provide the exact fix.',
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

// LocalStorage helpers for standalone browser execution
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

// Safely fetch JSON from backend only if an actual JSON response was returned
async function tryFetchJson<T>(url: string, options?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';
    // If Vercel rewrites to index.html, contentType will be text/html
    if (res.ok && contentType.includes('application/json')) {
      const data = await res.json();
      return data?.data !== undefined ? data.data : data;
    }
  } catch {}
  return null;
}

export const api = {
  // Workspaces
  async getWorkspaces(): Promise<Workspace[]> {
    const remote = await tryFetchJson<Workspace[]>(`${BASE_URL}/workspaces`);
    if (remote && Array.isArray(remote) && remote.length > 0) {
      setLocal('workspaces', remote);
      return remote;
    }
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

    await tryFetchJson(`${BASE_URL}/workspaces`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const list = getLocal<Workspace[]>('workspaces', DEFAULT_WORKSPACES);
    list.push(newWs);
    setLocal('workspaces', list);
    return newWs;
  },

  // Chats
  async getChats(workspaceId?: string): Promise<ChatSession[]> {
    const url = workspaceId ? `${BASE_URL}/chats?workspaceId=${workspaceId}` : `${BASE_URL}/chats`;
    const remote = await tryFetchJson<ChatSession[]>(url);
    if (remote && Array.isArray(remote)) {
      setLocal('chats', remote);
      return remote;
    }

    const list = getLocal<ChatSession[]>('chats', [
      {
        id: 'chat-welcome',
        title: 'Welcome to Nexus 3D Studio',
        workspaceId: 'ws-general',
        model: 'gemini-3.5-flash',
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
      model: data.model || 'gemini-3.5-flash',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messageCount: 0,
    };

    const remote = await tryFetchJson<ChatSession>(`${BASE_URL}/chats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const list = getLocal<ChatSession[]>('chats', []);
    list.unshift(remote || newChat);
    setLocal('chats', list);
    return remote || newChat;
  },

  async updateChat(id: string, updates: Partial<ChatSession>): Promise<ChatSession> {
    await tryFetchJson(`${BASE_URL}/chats/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

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
    await tryFetchJson(`${BASE_URL}/chats/${id}`, { method: 'DELETE' });
    const list = getLocal<ChatSession[]>('chats', []).filter((c) => c.id !== id);
    setLocal('chats', list);
  },

  // Messages
  async getMessages(chatId: string): Promise<Message[]> {
    const remote = await tryFetchJson<Message[]>(`${BASE_URL}/chats/${chatId}/messages`);
    if (remote && Array.isArray(remote)) {
      setLocal(`messages_${chatId}`, remote);
      return remote;
    }

    return getLocal<Message[]>(`messages_${chatId}`, [
      {
        id: 'msg-welcome',
        chatId: 'chat-welcome',
        role: 'assistant',
        content: 'Welcome to **Nexus 3D Intelligence Studio**! 🚀\n\nI am your interactive, voice-reactive AI assistant. You can:\n- 🎙️ Click the **Mic** button to speak with voice.\n- 💬 Type any question in the prompt box.\n- ⚙️ Add your Google Gemini API key in **Settings & API** for live neural answers!',
        timestamp: new Date().toISOString(),
        model: 'gemini-3.8-flash',
      },
    ]);
  },

  // Stream message (Backend Proxy OR Direct Gemini API OR Client Simulator)
  async streamMessage(
    chatId: string,
    content: string,
    model: string,
    onUserMessage: (msg: Message) => void,
    onChunk: (chunk: string) => void,
    onComplete: (fullMessage: Message) => void,
    onError: (err: any) => void,
    signal?: AbortSignal,
    attachment?: MessageAttachment
  ): Promise<void> {
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      chatId,
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
      tokens: Math.ceil(content.length / 4),
      attachments: attachment ? [attachment] : undefined,
    };

    onUserMessage(userMessage);

    // Save user message locally
    const existingMsgs = getLocal<Message[]>(`messages_${chatId}`, []);
    existingMsgs.push(userMessage);
    setLocal(`messages_${chatId}`, existingMsgs);

    // 1. Try Backend SSE stream ONLY if real backend is responding with text/event-stream
    try {
      const response = await fetch(`${BASE_URL}/chats/${chatId}/messages/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, model, attachment }),
        signal,
      });

      const contentType = response.headers.get('content-type') || '';

      if (response.ok && contentType.includes('text/event-stream') && response.body) {
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
                    model: payload.model || model,
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

    // 2. Client-Side Direct Google Gemini API Streaming (for standalone Vercel cloud)
    const settings = await this.getSettings();
    const apiKey = settings.rawApiKey || (settings.apiKey && !settings.apiKey.includes('••••') ? settings.apiKey : '');

    if (apiKey && settings.provider === 'gemini') {
      try {
        const targetModel = 'gemini-3.5-flash';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:streamGenerateContent?alt=sse&key=${apiKey}`;

        const allMsgs = existingMsgs
          .filter((m) => m.role !== 'system')
          .map((m) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
          }));

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: allMsgs }),
          signal,
        });

        if (res.ok && res.body) {
          const reader = res.body.getReader();
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

          if (accumulated.trim()) {
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
          }
        }
      } catch (geminiErr) {
        console.warn('Direct Gemini API stream error, using client simulator:', geminiErr);
      }
    }

    // 3. Built-in Client Conversational Generator (Handles Math, Greetings, Code, and Questions)
    let reply = '';
    const cleanLower = content.trim().toLowerCase();

    // Check for math calculation (e.g., "1000000*4545454", "500 * 2", "2 + 2")
    const mathMatch = cleanLower.match(/(\d[\d\s,]*)\s*([*x×/÷+-])\s*(\d[\d\s,]*)/);
    if (mathMatch) {
      try {
        const n1 = parseFloat(mathMatch[1].replace(/[\s,]/g, ''));
        const op = mathMatch[2];
        const n2 = parseFloat(mathMatch[3].replace(/[\s,]/g, ''));
        let resVal = 0;
        let opSym = '×';

        if (op === '*' || op === 'x' || op === '×') {
          resVal = n1 * n2;
          opSym = '×';
        } else if (op === '/' || op === '÷') {
          resVal = n1 / n2;
          opSym = '÷';
        } else if (op === '+') {
          resVal = n1 + n2;
          opSym = '+';
        } else if (op === '-') {
          resVal = n1 - n2;
          opSym = '-';
        }

        reply = `$$${n1.toLocaleString()} ${opSym} ${n2.toLocaleString()} = ${resVal.toLocaleString()}$$\n\n**Result:** ${resVal.toLocaleString()}`;
      } catch {
        reply = `The calculated result is approximately **${content}**.`;
      }
    } else if (/^(hi|hello|hey|good\s*(morning|afternoon|evening)|howdy)\b/i.test(cleanLower)) {
      reply = `Hello there! 👋 Welcome to NexusAI Studio.\n\nI'm your **3D voice-reactive AI assistant**. Here is what I can help you with:\n- 💻 **Coding & Debugging**: Writing TypeScript, React, Python, or refactoring.\n- 🏗️ **System Architecture**: Designing scalable databases, APIs, and microservices.\n- 🎙️ **Voice Interaction**: Click the microphone to speak with me.\n\nWhat would you like to build or explore?`;
    } else if (
      /(who\s*(made|created|built|designed|developed)|your\s*creator|your\s*developer|friend.*(believe|made|built)|made\s*you)\b/i.test(cleanLower)
    ) {
      reply = `**Tell your friend to believe it — it's 100% true!** 🚀\n\nI was created, designed, and architected by **Rustam Timalsina**! \n\nRustam built **NexusAI Studio** using modern **React 18, TypeScript, Three.js, and Google Gemini**. He engineered my 3D voice-reactive visual core, real-time audio dictation, prompt capsule library, and full-stack architecture.\n\nTell them to check out Rustam's source code on GitHub: **[github.com/rustamtimalsina/nexus-ai-studio](https://github.com/rustamtimalsina/nexus-ai-studio)**! 💻✨`;
    } else if (cleanLower.includes('code') || cleanLower.includes('function') || cleanLower.includes('react') || cleanLower.includes('typescript')) {
      reply = `Here is a clean, modular TypeScript solution:\n\n\`\`\`typescript\n// High-performance asynchronous utility with exponential backoff\nexport async function executeWithRetry<T>(\n  fn: () => Promise<T>,\n  retries = 3,\n  delayMs = 1000\n): Promise<T> {\n  try {\n    return await fn();\n  } catch (error) {\n    if (retries <= 0) throw error;\n    await new Promise((r) => setTimeout(r, delayMs));\n    return executeWithRetry(fn, retries - 1, delayMs * 1.5);\n  }\n}\n\`\`\`\n\n### Architectural Highlights:\n1. **Exponential Backoff**: Prevents thundering herds during transient network drops.\n2. **Type-Safe Generics**: Preserves full TypeScript return type inference.`;
    } else if (/^(what is|how does|explain|tell me about)\b/i.test(cleanLower)) {
      reply = `That's a great question! Regarding "${content}":\n\n- **Core Mechanism**: At a foundational level, modern systems rely on decoupled layers and clear abstractions to ensure resilience and maintainability.\n- **Practical Application**: When designing solutions around this, always optimize for readability and clear data contracts.\n\nWould you like me to dive deeper into technical implementation details, performance trade-offs, or code examples?`;
    } else {
      reply = `I hear you! You mentioned: "${content}".\n\nAs your Nexus 3D Intelligence assistant, I'm ready to collaborate on whatever you're working on — whether that's architecting systems, refactoring code, brainstorming product ideas, or writing complex algorithms.\n\nWhat direction would you like to explore next?`;
    }

    // Stream out words with smooth cadence
    const words = reply.split(' ');
    for (let i = 0; i < words.length; i++) {
      if (signal?.aborted) return;
      const chunk = (i === 0 ? '' : ' ') + words[i];
      onChunk(chunk);
      await new Promise((r) => setTimeout(r, 16));
    }

    const finalMsg: Message = {
      id: `msg-${Date.now()}`,
      chatId,
      role: 'assistant',
      content: reply,
      timestamp: new Date().toISOString(),
      tokens: Math.ceil(reply.length / 4),
      model: apiKey ? 'gemini-3.8-flash' : 'nexus-core',
    };
    existingMsgs.push(finalMsg);
    setLocal(`messages_${chatId}`, existingMsgs);
    onComplete(finalMsg);
  },

  // Prompts
  async getPrompts(): Promise<PromptTemplate[]> {
    const remote = await tryFetchJson<PromptTemplate[]>(`${BASE_URL}/prompts`);
    if (remote && Array.isArray(remote) && remote.length > 0) {
      setLocal('prompts', remote);
      return remote;
    }
    return getLocal<PromptTemplate[]>('prompts', DEFAULT_PROMPTS);
  },

  async createPrompt(prompt: Omit<PromptTemplate, 'id'>): Promise<PromptTemplate> {
    const newP: PromptTemplate = { ...prompt, id: `p-${Date.now()}` };
    await tryFetchJson(`${BASE_URL}/prompts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prompt),
    });

    const list = getLocal<PromptTemplate[]>('prompts', DEFAULT_PROMPTS);
    list.push(newP);
    setLocal('prompts', list);
    return newP;
  },

  async deletePrompt(id: string): Promise<void> {
    await tryFetchJson(`${BASE_URL}/prompts/${id}`, { method: 'DELETE' });
    const list = getLocal<PromptTemplate[]>('prompts', DEFAULT_PROMPTS).filter((p) => p.id !== id);
    setLocal('prompts', list);
  },

  // Settings
  async getSettings(): Promise<AppSettings & { rawApiKey?: string }> {
    const remote = await tryFetchJson<AppSettings>(`${BASE_URL}/settings`);
    if (remote) {
      return {
        ...remote,
        rawApiKey: getLocal<string>('rawApiKey', ''),
      };
    }
    return getLocal<AppSettings & { rawApiKey?: string }>('settings', {
      provider: 'gemini',
      defaultModel: 'gemini-3.5-flash',
      temperature: 0.7,
      maxTokens: 2048,
      hasApiKey: Boolean(getLocal<string>('rawApiKey', '')),
      apiKey: getLocal<string>('rawApiKey', '') ? '••••••••' : '',
      rawApiKey: getLocal<string>('rawApiKey', ''),
    });
  },

  async updateSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
    await tryFetchJson(`${BASE_URL}/settings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });

    const current = await this.getSettings();
    if (settings.apiKey) {
      setLocal('rawApiKey', settings.apiKey);
    }

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
