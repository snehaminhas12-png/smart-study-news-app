export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const allowed = (env.ALLOWED_ORIGIN || '').split(',').map(v => v.trim()).filter(Boolean);
    const corsOrigin = allowed.includes(origin) ? origin : '';
    const headers = {
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Vary': 'Origin'
    };
    if (corsOrigin) headers['Access-Control-Allow-Origin'] = corsOrigin;
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });

    const url = new URL(request.url);
    if (url.pathname === '/api/health' && request.method === 'GET') {
      return Response.json({ ok: true, configured: Boolean(env.GEMINI_API_KEY) }, { headers });
    }
    if (url.pathname !== '/api/generate' || request.method !== 'POST') {
      return Response.json({ error: 'Not found' }, { status: 404, headers });
    }
    if (!corsOrigin && origin) return Response.json({ error: 'Origin is not allowed' }, { status: 403, headers });
    if (!env.GEMINI_API_KEY) return Response.json({ error: 'Gemini API key is not configured' }, { status: 503, headers });

    let input;
    try {
      const body = await request.text();
      if (body.length > 12000) return Response.json({ error: 'Request is too large' }, { status: 413, headers });
      input = JSON.parse(body);
    } catch (_) {
      return Response.json({ error: 'Invalid JSON' }, { status: 400, headers });
    }
    const topic = typeof input.topic === 'string' ? input.topic.trim().slice(0, 100) : '';
    const subject = typeof input.subject === 'string' ? input.subject.trim().slice(0, 100) : '';
    const previous = Array.isArray(input.previousFacts) ? input.previousFacts.filter(v => typeof v === 'string').slice(-5).map(v => v.slice(0, 300)) : [];
    if (!topic) return Response.json({ error: 'A topic is required' }, { status: 400, headers });

    const task = input.simplify
      ? 'Explain the concept in one very simple, memorable sentence for a student. Use plain language.'
      : 'Create one accurate, surprising, memorable study fact in one or two short sentences for a student. Avoid unsupported claims and avoid a headline or markdown.';
    const prompt = `You are a careful study companion. Subject: ${subject || 'General study'}. Topic: ${topic}. ${task} Do not repeat these recent facts: ${JSON.stringify(previous)}. Return only the fact.`;
    try {
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.75, maxOutputTokens: 130 } })
      });
      if (!response.ok) {
        const code = response.status === 429 ? 429 : 502;
        return Response.json({ error: response.status === 429 ? 'Gemini free-tier rate limit reached. Please try again shortly.' : 'Gemini could not generate a study fact.' }, { status: code, headers });
      }
      const data = await response.json();
      const fact = data.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('').trim();
      if (!fact) return Response.json({ error: 'Gemini returned an empty answer' }, { status: 502, headers });
      return Response.json({ fact }, { headers });
    } catch (_) {
      return Response.json({ error: 'Could not reach Gemini' }, { status: 502, headers });
    }
  }
};
