declare const process: any;

const DEFAULT_PROMPTS = [
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

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  return res.status(200).json({ data: DEFAULT_PROMPTS });
}
