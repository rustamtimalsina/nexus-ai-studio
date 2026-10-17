import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { store } from '../data/store.js';
import { Workspace } from '../types/index.js';

const router = Router();

// Get all workspaces
router.get('/', (req: Request, res: Response) => {
  const workspaces = store.getWorkspaces();
  res.json({ success: true, data: workspaces });
});

// Create a new workspace
router.post('/', (req: Request, res: Response) => {
  const { name, description, icon = 'Layers', systemPrompt } = req.body;
  if (!name || !systemPrompt) {
    res.status(400).json({ success: false, error: 'Name and system prompt are required' });
    return;
  }

  const newWorkspace: Workspace = {
    id: `ws-${uuidv4().slice(0, 8)}`,
    name,
    description: description || '',
    icon,
    systemPrompt,
    createdAt: new Date().toISOString(),
  };

  const saved = store.addWorkspace(newWorkspace);
  res.status(201).json({ success: true, data: saved });
});

export default router;
