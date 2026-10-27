declare const process: any;

const DEFAULT_WORKSPACES = [
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

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    const ws = {
      id: `ws-${Date.now()}`,
      ...req.body,
      createdAt: new Date().toISOString(),
    };
    return res.status(201).json({ data: ws });
  }

  return res.status(200).json({ data: DEFAULT_WORKSPACES });
}
