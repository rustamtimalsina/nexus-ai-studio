declare const process: any;

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {}
    }
    const newChat = {
      id: `chat-${Date.now()}`,
      title: body?.title || 'New Conversation',
      workspaceId: body?.workspaceId || 'ws-general',
      model: body?.model || 'gemini-3.5-flash',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messageCount: 0,
    };
    return res.status(201).json({ data: newChat });
  }

  // GET: return empty list or OK status
  return res.status(200).json({ data: [] });
}
