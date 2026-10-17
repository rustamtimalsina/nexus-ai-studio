import { Response } from 'express';
import { store } from '../data/store.js';
import { Message } from '../types/index.js';

interface StreamOptions {
  model: string;
  systemPrompt?: string;
  messages: Message[];
  res: Response;
}

export class AIService {
  static async streamResponse({ model, systemPrompt, messages, res }: StreamOptions) {
    const settings = store.getSettings();
    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
    const userPrompt = lastUserMessage?.content || '';

    // Check if real Gemini API key is configured
    if (settings.provider === 'gemini' && settings.apiKey) {
      try {
        await this.streamGeminiApi(settings.apiKey, model, systemPrompt, messages, res);
        return;
      } catch (err: any) {
        console.error('Gemini API error, falling back to simulated stream:', err?.message || err);
        res.write(`data: ${JSON.stringify({ chunk: `\n\n> *[Gemini API Note: ${err?.message || 'Error occurred'}, falling back to offline assistant]*\n\n` })}\n\n`);
      }
    }

    // Default: Intelligent Simulated Streamer
    await this.streamSmartSimulated(userPrompt, model, systemPrompt, res);
  }

  private static async streamSmartSimulated(userPrompt: string, model: string, systemPrompt: string | undefined, res: Response) {
    let fullResponse = '';
    const lower = userPrompt.toLowerCase();

    // Greetings
    if (/^(hi|hello|hey|greetings|good\s*(morning|afternoon|evening)|howdy)\b/i.test(lower.trim())) {
      fullResponse = `Hello there! 👋 Welcome to NexusAI Studio.

I'm your AI workspace assistant. Here is what I can help you with:
- 💻 **Coding & Debugging**: Writing TypeScript, React, Python, algorithms, or refactoring existing code.
- 🏗️ **System Architecture**: Designing scalable databases, APIs, caches, and microservices.
- 💡 **Brainstorming & Solutions**: Answering questions, writing documentation, or exploring concepts.

What would you like to work on today?`;
    } else if (/^(who are you|what are you|what can you do|help)\b/i.test(lower.trim())) {
      fullResponse = `I am **NexusAI**, a workspace assistant designed to help developers and analysts brainstorm, code, and solve technical challenges.

### Capabilities:
1. **Workspaces**: Switch contexts in the sidebar (Full-Stack Engineer, Research, or custom).
2. **Prompt Templates**: Use pre-made templates for code review, bug diagnostics, or architecture.
3. **Live AI Connection**: By default, I run locally in demo mode. You can add your real Google Gemini API key in **Settings** (top right) to chat with live **Gemini 1.5 Pro**!

Feel free to ask me any programming question or explore a prompt!`;
    } else if (lower.includes('code') || lower.includes('function') || lower.includes('react') || lower.includes('typescript') || lower.includes('javascript') || lower.includes('refactor')) {
      fullResponse = `Here is a clean, modular solution tailored for modern TypeScript/React applications:

\`\`\`typescript
import React, { useState, useEffect, useCallback } from 'react';

interface DataState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Custom hook for resilient data fetching with cancellation
 */
export function useFetchData<T>(url: string): DataState<T> {
  const [state, setState] = useState<DataState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchData = useCallback(async (signal: AbortSignal) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await fetch(url, { signal });
      if (!response.ok) {
        throw new Error(\`HTTP error! status: \${response.status}\`);
      }
      const json = await response.json();
      setState({ data: json, loading: false, error: null });
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setState({ data: null, loading: false, error: err as Error });
      }
    }
  }, [url]);

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, [fetchData]);

  return state;
}
\`\`\`

### Key Features:
1. **Type-Safe**: Full generic support (\`<T>\`) for clean inference.
2. **AbortController**: Automatically cancels in-flight requests when the component unmounts or dependencies change.
3. **Immutability**: Clear separation between loading, success, and error states.`;
    } else if (lower.includes('architecture') || lower.includes('design') || lower.includes('system') || lower.includes('database')) {
      fullResponse = `### High-Level System Architecture Overview

When architecting this solution, we focus on high availability, low latency, and ease of scaling.

#### 1. Core Layers
- **Edge / CDN & Gateway**: Cloudflare / AWS CloudFront routing traffic, SSL termination, and rate limiting.
- **Application Services**: Stateless Node.js / Go microservices deployed in containerized orchestrations (Docker / Kubernetes).
- **Caching Layer**: Redis cluster for session state, hot read queries, and real-time pub/sub channels.
- **Persistence**: PostgreSQL for relational guarantees, supplemented with S3 for blob/file assets.

#### 2. Data Flow
1. Client issues authenticated JWT request to API Gateway.
2. Gateway verifies token and checks Redis token blacklist / rate limits.
3. Service processes payload, reads/writes to primary DB with read-replicas for heavy reporting.
4. Asynchronous jobs (notifications, analytics) are dispatched to an event queue (Kafka or RabbitMQ).`;
    } else {
      fullResponse = `You asked: "${userPrompt}"

Here is my perspective based on the current workspace context (\`${systemPrompt ? systemPrompt.slice(0, 45) + '...' : 'General Assistant'}\`):

1. **Direct Answer**:
   To address this effectively, clarify your primary objective and constraints first.
2. **Recommendation**:
   If this is a technical query, consider sharing code snippets, specific error messages, or architecture details.
3. **Live AI Models**:
   To unlock full real-world reasoning and answer any complex custom question, click **Settings & API** in the sidebar and enter a Google Gemini API key!`;
    }

    // Stream out chunks
    const words = fullResponse.split(' ');
    for (let i = 0; i < words.length; i++) {
      const chunk = (i === 0 ? '' : ' ') + words[i];
      res.write(`data: ${JSON.stringify({ chunk, done: false })}\n\n`);
      // Sleep a tiny bit to simulate human/AI streaming cadence
      await new Promise((resolve) => setTimeout(resolve, 20));
    }

    const estimatedTokens = Math.ceil(fullResponse.length / 4);
    res.write(`data: ${JSON.stringify({ done: true, fullText: fullResponse, tokens: estimatedTokens, model })}\n\n`);
    res.end();
  }

  private static async streamGeminiApi(
    apiKey: string,
    model: string,
    systemPrompt: string | undefined,
    messages: Message[],
    res: Response
  ) {
    // Resolve model to currently active Gemini versions
    let formattedModel = model;
    if (
      !formattedModel ||
      formattedModel.includes('1.5') ||
      formattedModel.includes('2.0') ||
      formattedModel.includes('2.5') ||
      formattedModel === 'gpt-4o' ||
      formattedModel === 'claude-3-5-sonnet'
    ) {
      formattedModel = 'gemini-3.8-flash';
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${formattedModel}:streamGenerateContent?alt=sse&key=${apiKey}`;

    const contents = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    const body: any = {
      contents,
    };

    if (systemPrompt) {
      body.systemInstruction = {
        parts: [{ text: systemPrompt }],
      };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${errorText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No readable stream from Gemini API');

    const decoder = new TextDecoder();
    let accumulatedText = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      // Keep unfinished line in buffer
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ')) {
          const jsonStr = trimmed.slice(6);
          try {
            const data = JSON.parse(jsonStr);
            const candidates = data.candidates || [];
            for (const cand of candidates) {
              const parts = cand.content?.parts || [];
              for (const part of parts) {
                if (part.text) {
                  accumulatedText += part.text;
                  res.write(`data: ${JSON.stringify({ chunk: part.text, done: false })}\n\n`);
                }
              }
            }
          } catch {
            // Ignore parse errors on malformed lines
          }
        }
      }
    }

    // Process any remaining line in buffer
    if (buffer.trim().startsWith('data: ')) {
      try {
        const data = JSON.parse(buffer.trim().slice(6));
        const parts = data.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
          if (part.text) {
            accumulatedText += part.text;
            res.write(`data: ${JSON.stringify({ chunk: part.text, done: false })}\n\n`);
          }
        }
      } catch {}
    }

    const tokens = Math.ceil(accumulatedText.length / 4);
    res.write(`data: ${JSON.stringify({ done: true, fullText: accumulatedText, tokens, model: formattedModel })}\n\n`);
    res.end();
  }
}
