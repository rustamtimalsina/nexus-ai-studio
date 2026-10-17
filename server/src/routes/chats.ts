import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { store } from '../data/store.js';
import { AIService } from '../services/aiService.js';
import { ChatSession, Message } from '../types/index.js';

const router = Router();

// Get all chats (optional ?workspaceId=...)
router.get('/', (req: Request, res: Response) => {
  const { workspaceId } = req.query;
  const chats = store.getChats(workspaceId as string | undefined);
  res.json({ success: true, data: chats });
});

// Create a new chat
router.post('/', (req: Request, res: Response) => {
  const { title = 'New Chat', workspaceId = 'ws-general', model = 'gemini-1.5-pro' } = req.body;
  const newChat: ChatSession = {
    id: `chat-${uuidv4().slice(0, 8)}`,
    title,
    workspaceId,
    model,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messageCount: 0,
  };
  const created = store.createChat(newChat);
  res.status(201).json({ success: true, data: created });
});

// Get a chat by ID
router.get('/:id', (req: Request, res: Response) => {
  const id = req.params.id as string;
  const chat = store.getChat(id);
  if (!chat) {
    res.status(404).json({ success: false, error: 'Chat session not found' });
    return;
  }
  res.json({ success: true, data: chat });
});

// Update a chat
router.patch('/:id', (req: Request, res: Response) => {
  const id = req.params.id as string;
  const updated = store.updateChat(id, req.body);
  if (!updated) {
    res.status(404).json({ success: false, error: 'Chat not found' });
    return;
  }
  res.json({ success: true, data: updated });
});

// Delete a chat
router.delete('/:id', (req: Request, res: Response) => {
  const id = req.params.id as string;
  const deleted = store.deleteChat(id);
  if (!deleted) {
    res.status(404).json({ success: false, error: 'Chat not found' });
    return;
  }
  res.json({ success: true, message: 'Chat deleted' });
});

// Get messages for a chat
router.get('/:id/messages', (req: Request, res: Response) => {
  const id = req.params.id as string;
  const messages = store.getMessages(id);
  res.json({ success: true, data: messages });
});

// Send a user message and stream back AI response (SSE)
router.post('/:id/messages/stream', async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { content, model: overrideModel } = req.body;

  const chat = store.getChat(id);
  if (!chat) {
    res.status(404).json({ success: false, error: 'Chat not found' });
    return;
  }

  const workspace = store.getWorkspace(chat.workspaceId);
  const modelToUse = overrideModel || chat.model || 'gemini-1.5-pro';

  // 1. Save user message
  const userMessage: Message = {
    id: `msg-${uuidv4().slice(0, 8)}`,
    chatId: id,
    role: 'user',
    content,
    timestamp: new Date().toISOString(),
    tokens: Math.ceil(content.length / 4),
  };
  store.addMessage(userMessage);

  // 2. Set up SSE stream
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  // Send acknowledgement with user message
  res.write(`data: ${JSON.stringify({ userMessage })}\n\n`);

  const allMessages = store.getMessages(id);

  // 3. Stream AI completion
  try {
    let assistantText = '';
    const tempRes = {
      write: (data: string) => {
        res.write(data);
        if (data.startsWith('data: ')) {
          try {
            const parsed = JSON.parse(data.replace('data: ', '').trim());
            if (parsed.chunk) assistantText += parsed.chunk;
            if (parsed.fullText) assistantText = parsed.fullText;
          } catch {}
        }
      },
      end: () => {
        // Save assistant message to store
        const assistantMessage: Message = {
          id: `msg-${uuidv4().slice(0, 8)}`,
          chatId: id,
          role: 'assistant',
          content: assistantText,
          timestamp: new Date().toISOString(),
          tokens: Math.ceil(assistantText.length / 4),
          model: modelToUse,
        };
        store.addMessage(assistantMessage);
        res.end();
      },
    } as any;

    await AIService.streamResponse({
      model: modelToUse,
      systemPrompt: workspace?.systemPrompt,
      messages: allMessages,
      res: tempRes,
    });
  } catch (error: any) {
    console.error('Error generating AI response:', error);
    res.write(`data: ${JSON.stringify({ error: error.message || 'Stream error' })}\n\n`);
    res.end();
  }
});

export default router;
