import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import chatsRouter from './routes/chats.js';
import promptsRouter from './routes/prompts.js';
import workspacesRouter from './routes/workspaces.js';
import settingsRouter from './routes/settings.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/chats', chatsRouter);
app.use('/api/prompts', promptsRouter);
app.use('/api/workspaces', workspacesRouter);
app.use('/api/settings', settingsRouter);

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'NexusAI Studio API',
  });
});

app.listen(PORT, () => {
  console.log(`🚀 NexusAI Studio Backend running on http://localhost:${PORT}`);
});
