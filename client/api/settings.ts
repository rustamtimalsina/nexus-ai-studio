declare const process: any;

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const hasApiKey = Boolean(process.env.GEMINI_API_KEY);
  return res.status(200).json({
    data: {
      provider: 'gemini',
      defaultModel: 'gemini-3.5-flash',
      temperature: 0.7,
      maxTokens: 2048,
      hasApiKey,
      apiKey: hasApiKey ? '••••••••' : '',
    },
  });
}
