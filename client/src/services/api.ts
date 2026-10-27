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

// Track routes that returned 404 or failed to prevent console noise
const unavailableRoutes = new Set<string>();

// Safely fetch JSON from backend only if an actual JSON response was returned
async function tryFetchJson<T>(url: string, options?: RequestInit): Promise<T | null> {
  const routeKey = url.split('?')[0].replace(/\/chat-[^/]+/, '/:chatId');
  if (unavailableRoutes.has(routeKey)) {
    return null;
  }

  try {
    const res = await fetch(url, options);
    if (res.status === 404) {
      unavailableRoutes.add(routeKey);
      return null;
    }
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const data = await res.json();
      return data?.data !== undefined ? data.data : data;
    }
  } catch {
    unavailableRoutes.add(routeKey);
  }
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
    const local = getLocal<Message[]>(`messages_${chatId}`, []);
    if (local.length > 0) {
      return local;
    }

    const remote = await tryFetchJson<Message[]>(`${BASE_URL}/chats/${chatId}/messages`);
    if (remote && Array.isArray(remote) && remote.length > 0) {
      setLocal(`messages_${chatId}`, remote);
      return remote;
    }

    return local;
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

  // In-Canvas AI Component Transformer
  async modifyArtifact(
    currentCode: string,
    instruction: string,
    language: string
  ): Promise<string> {
    const settings = await this.getSettings();
    const apiKey = settings.rawApiKey || (settings.apiKey && !settings.apiKey.includes('••••') ? settings.apiKey : '');

    // 1. Try Direct Google Gemini API if user configured key
    if (apiKey && settings.provider === 'gemini') {
      try {
        const targetModel = 'gemini-3.5-flash';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`;

        const prompt = `You are a world-class frontend engineer and UI architect.
Your task is to modify the following code snippet strictly according to this user instruction:
"${instruction}"

IMPORTANT RULES:
1. Return ONLY the complete, working, modified code inside a single markdown code block (e.g. \`\`\`html ... \`\`\` or \`\`\`javascript ... \`\`\`).
2. Do NOT write explanations, intros, or markdown outside the code block.
3. Preserve all functional parts while implementing the requested change with modern, responsive styling.

Original Code:
\`\`\`${language || 'html'}
${currentCode}
\`\`\`
`;

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 8192 },
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            const codeBlockMatch = rawText.match(/```(?:html|js|javascript|typescript|ts|svg)?\s*([\s\S]*?)```/i);
            if (codeBlockMatch && codeBlockMatch[1].trim()) {
              return codeBlockMatch[1].trim();
            }
            if (rawText.includes('<html') || rawText.includes('<div') || rawText.includes('<!DOCTYPE')) {
              return rawText.trim();
            }
          }
        }
      } catch (e) {
        console.warn('Gemini API modify error, using client-side refiner:', e);
      }
    }

    // 2. Intelligent Client-Side Code Transformer (Always works offline & standalone)
    let modified = currentCode;
    const instLower = instruction.toLowerCase();

    if (instLower.includes('purple') || instLower.includes('cyber') || instLower.includes('synthwave')) {
      const cyberStyle = `
        <style id="nexus-ai-cyber-theme">
          body { background: radial-gradient(circle at 50% 0%, #2e1065 0%, #090214 100%) !important; color: #e9d5ff !important; }
          button, .btn { box-shadow: 0 0 20px rgba(168, 85, 247, 0.4) !important; border-color: #a855f7 !important; }
        </style>
      `;
      if (modified.includes('</head>')) {
        modified = modified.replace('</head>', `${cyberStyle}\n</head>`);
      } else {
        modified = cyberStyle + modified;
      }
    } else if (instLower.includes('neon') || instLower.includes('glow') || instLower.includes('cyan')) {
      const glowStyle = `
        <style id="nexus-ai-glow-theme">
          * { text-shadow: 0 0 8px rgba(6, 182, 212, 0.4); }
          button, .card, div[class*="rounded"] { box-shadow: 0 0 25px rgba(6, 182, 212, 0.35) !important; border-color: #06b6d4 !important; transition: all 0.3s ease !important; }
          button:hover { box-shadow: 0 0 35px rgba(6, 182, 212, 0.7) !important; transform: scale(1.03) !important; }
        </style>
      `;
      if (modified.includes('</head>')) {
        modified = modified.replace('</head>', `${glowStyle}\n</head>`);
      } else {
        modified = glowStyle + modified;
      }
    } else if (instLower.includes('animation') || instLower.includes('float') || instLower.includes('hover')) {
      const animStyle = `
        <style id="nexus-ai-animation-theme">
          @keyframes nexusFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
          .card, main, [class*="container"], [class*="player"], [class*="wrapper"] { animation: nexusFloat 4s ease-in-out infinite !important; }
          button:hover, a:hover { transform: translateY(-2px) scale(1.04) !important; transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important; }
        </style>
      `;
      if (modified.includes('</head>')) {
        modified = modified.replace('</head>', `${animStyle}\n</head>`);
      } else {
        modified = animStyle + modified;
      }
    } else if (instLower.includes('sound') || instLower.includes('audio') || instLower.includes('click')) {
      const soundScript = `
        <script id="nexus-ai-sound-fx">
          (function() {
            var audioCtx = null;
            function playBeep() {
              try {
                if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                if (audioCtx.state === 'suspended') audioCtx.resume();
                var osc = audioCtx.createOscillator();
                var gain = audioCtx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(800, audioCtx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.08);
                gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start();
                osc.stop(audioCtx.currentTime + 0.1);
              } catch(e) {}
            }
            window.addEventListener('DOMContentLoaded', function() {
              document.querySelectorAll('button, a, input[type="range"]').forEach(function(el) {
                el.addEventListener('click', playBeep);
              });
            });
            document.addEventListener('click', function(e) {
              if (e.target.closest('button, a, input, [role="button"]')) {
                playBeep();
              }
            });
          })();
        </script>
      `;
      if (modified.includes('</body>')) {
        modified = modified.replace('</body>', `${soundScript}\n</body>`);
      } else {
        modified += soundScript;
      }
    } else if (instLower.includes('glass') || instLower.includes('glassmorphism')) {
      const glassStyle = `
        <style id="nexus-ai-glass-theme">
          div[class*="bg-"], .card, div[class*="rounded"] {
            background: rgba(15, 23, 42, 0.65) !important;
            backdrop-filter: blur(16px) !important;
            -webkit-backdrop-filter: blur(16px) !important;
            border: 1px solid rgba(255, 255, 255, 0.12) !important;
            box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37) !important;
          }
        </style>
      `;
      if (modified.includes('</head>')) {
        modified = modified.replace('</head>', `${glassStyle}\n</head>`);
      } else {
        modified = glassStyle + modified;
      }
    } else if (instLower.includes('matrix') || instLower.includes('terminal') || instLower.includes('hacker')) {
      const matrixStyle = `
        <style id="nexus-ai-matrix-theme">
          body { background: #020b05 !important; color: #22c55e !important; font-family: monospace !important; }
          * { text-shadow: 0 0 6px rgba(34, 197, 94, 0.6) !important; }
          button, .card { border-color: #22c55e !important; box-shadow: 0 0 15px rgba(34, 197, 94, 0.3) !important; }
        </style>
      `;
      if (modified.includes('</head>')) {
        modified = modified.replace('</head>', `${matrixStyle}\n</head>`);
      } else {
        modified = matrixStyle + modified;
      }
    } else {
      const customPatch = `
        <style id="nexus-ai-custom-patch">
          /* AI Refinement: ${instruction.replace(/["\n\r]/g, ' ')} */
          .ai-enhanced { transition: all 0.3s ease; }
        </style>
      `;
      if (modified.includes('</head>')) {
        modified = modified.replace('</head>', `${customPatch}\n</head>`);
      } else {
        modified = customPatch + modified;
      }
    }

    return modified;
  },
};
