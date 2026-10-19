declare const process: any;

export default async function handler(req: any, res: any) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Parse body
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {}
  }

  const content = body?.content || '';
  const attachment = body?.attachment;
  const requestedModel = body?.model;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY environment variable not configured' });
  }

  try {
    const defaultCandidates = ['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-3.8-flash', 'gemini-2.5-flash', 'gemini-2.5-pro'];
    const candidateModels = requestedModel
      ? [requestedModel, ...defaultCandidates.filter((m) => m !== requestedModel)]
      : defaultCandidates;
    let geminiRes: any = null;
    let usedModel = candidateModels[0];

    const systemInstruction =
      'You are NexusAI Studio, an interactive, smart, and friendly AI assistant created and engineered by Rustam Timalsina. Always answer naturally, intelligently, and helpfully. If analyzing an image or screenshot, describe it thoroughly and if requested, generate clean runnable HTML/Tailwind/React code so the user can preview it in the live Artifact Canvas.';

    // Build multimodal user parts
    const userParts: any[] = [];
    if (content.trim()) {
      userParts.push({ text: content });
    }
    if (attachment && attachment.base64) {
      const cleanBase64 = attachment.base64.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');
      userParts.push({
        inline_data: {
          mime_type: attachment.mimeType || 'image/png',
          data: cleanBase64,
        },
      });
    }
    if (userParts.length === 0) {
      userParts.push({ text: 'Please analyze this uploaded visual media in detail.' });
    }

    for (const modelName of candidateModels) {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:streamGenerateContent?alt=sse&key=${apiKey}`;
      try {
        const candidate = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: {
              parts: [{ text: systemInstruction }],
            },
            contents: [
              {
                role: 'user',
                parts: userParts,
              },
            ],
          }),
        });

        if (candidate.ok) {
          geminiRes = candidate;
          usedModel = modelName;
          break;
        }
      } catch {}
    }

    if (!geminiRes || !geminiRes.ok) {
      return res.status(502).json({ error: 'All Gemini models busy' });
    }

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');

    const reader = geminiRes.body?.getReader();
    if (!reader) {
      return res.status(500).end();
    }

    const decoder = new TextDecoder();
    let accumulatedText = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ')) {
          try {
            const data = JSON.parse(trimmed.slice(6));
            const parts = data.candidates?.[0]?.content?.parts || [];
            for (const p of parts) {
              if (p.text) {
                accumulatedText += p.text;
                res.write(`data: ${JSON.stringify({ chunk: p.text })}\n\n`);
              }
            }
          } catch {}
        }
      }
    }

    const tokens = Math.ceil(accumulatedText.length / 4);
    res.write(
      `data: ${JSON.stringify({
        done: true,
        fullText: accumulatedText,
        tokens,
        model: usedModel,
      })}\n\n`
    );
    res.end();
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Gemini streaming error' });
  }
}
