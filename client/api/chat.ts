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
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY environment variable not configured' });
  }

  try {
    const targetModel = 'gemini-3.8-flash';
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:streamGenerateContent?alt=sse&key=${apiKey}`;

    const systemInstruction =
      'You are NexusAI Studio, an elite, articulate, and intelligent AI companion created and engineered by Rustam Timalsina. Always be helpful, witty, accurate, and structured. If asked who created or made you, proudly confirm that Rustam Timalsina built you using React, TypeScript, Three.js, and Gemini.';

    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemInstruction }],
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: content }],
          },
        ],
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      return res.status(geminiRes.status).json({ error: errText });
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
        model: 'gemini-3.8-flash',
      })}\n\n`
    );
    res.end();
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Gemini streaming error' });
  }
}
