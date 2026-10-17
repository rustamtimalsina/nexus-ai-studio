import { Router, Request, Response } from 'express';
import { store } from '../data/store.js';

const router = Router();

// Get settings (masking API key for security)
router.get('/', (_req: Request, res: Response) => {
  const settings = store.getSettings();
  const maskedKey = settings.apiKey ? `${settings.apiKey.slice(0, 4)}••••••••${settings.apiKey.slice(-4)}` : '';
  res.json({
    success: true,
    data: {
      ...settings,
      hasApiKey: Boolean(settings.apiKey),
      apiKey: maskedKey,
    },
  });
});

// Update settings
router.patch('/', (req: Request, res: Response) => {
  const updates = req.body;
  // If api key was sent as empty string or not modified, handle appropriately
  if (updates.apiKey === '') {
    delete updates.apiKey;
  }
  const updated = store.updateSettings(updates);
  const maskedKey = updated.apiKey ? `${updated.apiKey.slice(0, 4)}••••••••${updated.apiKey.slice(-4)}` : '';
  res.json({
    success: true,
    data: {
      ...updated,
      hasApiKey: Boolean(updated.apiKey),
      apiKey: maskedKey,
    },
  });
});

export default router;
