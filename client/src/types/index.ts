export type Role = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;
  chatId: string;
  role: Role;
  content: string;
  timestamp: string;
  tokens?: number;
  model?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  workspaceId: string;
  model: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

export interface Workspace {
  id: string;
  name: string;
  description: string;
  icon: string;
  systemPrompt: string;
  createdAt: string;
}

export interface PromptTemplate {
  id: string;
  title: string;
  description: string;
  category: 'Coding' | 'Writing' | 'Productivity' | 'Brainstorming' | 'Analysis';
  content: string;
  tags: string[];
}

export interface AppSettings {
  apiKey?: string;
  hasApiKey?: boolean;
  provider: 'mock' | 'gemini' | 'openai';
  defaultModel: string;
  temperature: number;
  maxTokens: number;
}
