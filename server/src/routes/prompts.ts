import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { store } from '../data/store.js';
import { PromptTemplate } from '../types/index.js';

const router = Router();

// Get all prompt templates
router.get('/', (req: Request, res: Response) => {
  const prompts = store.getPrompts();
  res.json({ success: true, data: prompts });
});

// Add a prompt template
router.post('/', (req: Request, res: Response) => {
  const { title, description, category, content, tags = [] } = req.body;
  if (!title || !content) {
    res.status(400).json({ success: false, error: 'Title and content are required' });
    return;
  }

  const newPrompt: PromptTemplate = {
    id: `p-${uuidv4().slice(0, 8)}`,
    title,
    description: description || '',
    category: category || 'Coding',
    content,
    tags,
  };

  const saved = store.addPrompt(newPrompt);
  res.status(201).json({ success: true, data: saved });
});

// Delete a prompt template
router.delete('/:id', (req: Request, res: Response) => {
  const id = req.params.id as string;
  const deleted = store.deletePrompt(id);
  if (!deleted) {
    res.status(404).json({ success: false, error: 'Prompt not found' });
    return;
  }
  res.json({ success: true, message: 'Prompt deleted' });
});

export default router;
