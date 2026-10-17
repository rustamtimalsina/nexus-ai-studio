import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ChatSession, Message, Workspace, PromptTemplate, AppSettings } from '../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, 'db.json');

interface Database {
  workspaces: Workspace[];
  chats: ChatSession[];
  messages: Message[];
  prompts: PromptTemplate[];
  settings: AppSettings;
}

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

const DEFAULT_SETTINGS: AppSettings = {
  provider: 'mock',
  defaultModel: 'gemini-3.8-flash',
  temperature: 0.7,
  maxTokens: 2048,
};

class Store {
  private data: Database;

  constructor() {
    this.data = this.load();
  }

  private load(): Database {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('Failed to read db.json, initializing defaults:', err);
    }

    const initialData: Database = {
      workspaces: DEFAULT_WORKSPACES,
      chats: [
        {
          id: 'chat-welcome',
          title: 'Welcome to NexusAI Studio',
          workspaceId: 'ws-general',
          model: 'gemini-3.8-flash',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          messageCount: 2,
        },
      ],
      messages: [
        {
          id: 'msg-1',
          chatId: 'chat-welcome',
          role: 'user',
          content: 'Hello! What can I do in this workspace?',
          timestamp: new Date(Date.now() - 60000).toISOString(),
          tokens: 8,
        },
        {
          id: 'msg-2',
          chatId: 'chat-welcome',
          role: 'assistant',
          content: "Welcome to **NexusAI Studio**! 🚀\n\nHere are some of the features ready for you:\n\n- 📂 **Workspaces**: Switch between specialized contexts (Full-Stack Engineer, Research, General).\n- 💬 **Real-time AI Chat**: Stream responses with formatting, markdown, and code highlighting.\n- 📚 **Prompt Library**: One-click reusable prompts for coding, debugging, and architecture.\n- ⚙️ **Configurable Models**: Connect real Gemini/OpenAI API keys or use the smart built-in engine.\n\nTry sending a message or picking a prompt from the sidebar!",
          timestamp: new Date().toISOString(),
          tokens: 95,
          model: 'gemini-1.5-pro',
        },
      ],
      prompts: DEFAULT_PROMPTS,
      settings: DEFAULT_SETTINGS,
    };

    this.save(initialData);
    return initialData;
  }

  private save(data: Database = this.data): void {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write db.json:', err);
    }
  }

  // Workspaces
  getWorkspaces(): Workspace[] {
    return this.data.workspaces;
  }

  getWorkspace(id: string): Workspace | undefined {
    return this.data.workspaces.find((w) => w.id === id);
  }

  addWorkspace(ws: Workspace): Workspace {
    this.data.workspaces.push(ws);
    this.save();
    return ws;
  }

  // Chats
  getChats(workspaceId?: string): ChatSession[] {
    if (workspaceId) {
      return this.data.chats.filter((c) => c.workspaceId === workspaceId);
    }
    return this.data.chats.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  getChat(id: string): ChatSession | undefined {
    return this.data.chats.find((c) => c.id === id);
  }

  createChat(chat: ChatSession): ChatSession {
    this.data.chats.unshift(chat);
    this.save();
    return chat;
  }

  updateChat(id: string, updates: Partial<ChatSession>): ChatSession | undefined {
    const chat = this.getChat(id);
    if (!chat) return undefined;
    Object.assign(chat, updates, { updatedAt: new Date().toISOString() });
    this.save();
    return chat;
  }

  deleteChat(id: string): boolean {
    const idx = this.data.chats.findIndex((c) => c.id === id);
    if (idx === -1) return false;
    this.data.chats.splice(idx, 1);
    this.data.messages = this.data.messages.filter((m) => m.chatId !== id);
    this.save();
    return true;
  }

  // Messages
  getMessages(chatId: string): Message[] {
    return this.data.messages.filter((m) => m.chatId === chatId);
  }

  addMessage(msg: Message): Message {
    this.data.messages.push(msg);
    const chat = this.getChat(msg.chatId);
    if (chat) {
      chat.messageCount = this.getMessages(msg.chatId).length;
      chat.updatedAt = new Date().toISOString();
      if (chat.title === 'New Chat' && msg.role === 'user') {
        chat.title = msg.content.slice(0, 32) + (msg.content.length > 32 ? '...' : '');
      }
    }
    this.save();
    return msg;
  }

  // Prompts
  getPrompts(): PromptTemplate[] {
    return this.data.prompts;
  }

  addPrompt(prompt: PromptTemplate): PromptTemplate {
    this.data.prompts.push(prompt);
    this.save();
    return prompt;
  }

  deletePrompt(id: string): boolean {
    const idx = this.data.prompts.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    this.data.prompts.splice(idx, 1);
    this.save();
    return true;
  }

  // Settings
  getSettings(): AppSettings {
    const s = this.data.settings;
    if (!s.apiKey && process.env.GEMINI_API_KEY) {
      s.apiKey = process.env.GEMINI_API_KEY;
      s.provider = 'gemini';
    }
    return s;
  }

  updateSettings(settings: Partial<AppSettings>): AppSettings {
    this.data.settings = { ...this.data.settings, ...settings };
    this.save();
    return this.data.settings;
  }
}

export const store = new Store();
