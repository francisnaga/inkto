const crypto = require('crypto');
const { nanoid } = require('nanoid');

const COOKIE_SECRET = process.env.COOKIE_SECRET || process.env.SUPABASE_ANON_KEY || 'inkto-default-secret';

function parseCookie(str) {
  return (str || '').split(';').reduce((r, c) => {
    const i = c.indexOf('='); if (i < 0) return r;
    const k = c.slice(0, i).trim(), v = c.slice(i + 1).trim();
    if (k) try { r[k] = decodeURIComponent(v); } catch { r[k] = v; }
    return r;
  }, {});
}

function verifyCookie(v) {
  if (!v) return null;
  const l = v.lastIndexOf(':'), l2 = v.lastIndexOf(':', l - 1);
  if (l < 0 || l2 < 0) return null;
  const email = v.slice(0, l2), exp = parseInt(v.slice(l2 + 1, l), 10), sig = v.slice(l + 1);
  if (!email || isNaN(exp) || Date.now() > exp) return null;
  const expected = crypto.createHmac('sha256', COOKIE_SECRET).update(`${email}:${exp}`).digest('hex');
  try { return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected)) ? email : null; } catch { return null; }
}

async function callGemini(apiKey, prompt, systemInstruction) {
  const models = ['gemini-3.5-flash-lite', 'gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-2.5-flash', 'gemini-1.5-flash'];
  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          systemInstruction: { role: 'system', parts: [{ text: systemInstruction }] },
          generationConfig: { temperature: 0.2, maxOutputTokens: 4096 }
        })
      });
      const data = await res.json();
      if (!res.ok) continue;
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text.trim();
    } catch (e) {
      console.warn(`[Draft] ${model} failed:`, e.message);
    }
  }
  throw new Error('AI drafting service was unavailable. Please try again.');
}

module.exports = async function handler(req, res) {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cookie, Authorization, X-Inkto-Auth');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const email = await require('./_utils/auth').getAuthEmail(req);
  if (!email) return res.status(401).json({ error: 'Please sign in to draft documents.', requireAuth: true });

  const { mode, userContent, templateContent, prompt } = req.body || {};

  if (mode === 'fit' && (!userContent || !templateContent)) {
    return res.status(400).json({ error: 'userContent and templateContent are required for AI-Fit.' });
  }
  if (mode === 'draft' && !prompt) {
    return res.status(400).json({ error: 'prompt is required for drafting.' });
  }

  try {
    const db = require('./_utils/supabase').checkSupabase();

    // Check plan & limits
    let userRow = null;
    try {
      const { data, error } = await db.from('users').select('subscription_status, plan_expires_at, is_pro').eq('email', email).single();
      if (error && (error.code === '42703' || error.message?.includes('does not exist'))) {
        const fallback = await db.from('users').select('subscription_status, plan_expires_at').eq('email', email).single();
        userRow = fallback.data;
      } else {
        userRow = data;
      }
    } catch {}
    const isPaid = userRow?.is_pro === true || (userRow?.subscription_status === 'active' && userRow?.plan_expires_at && new Date(userRow.plan_expires_at) > new Date());

    if (!isPaid) {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const { count } = await db.from('documents').select('id', { count: 'exact', head: true }).eq('email', email).gte('created_at', today.toISOString());
      if (count !== null && count >= 5) {
        return res.status(429).json({ error: 'You have used your 5 free conversions/drafts for today. Upgrade to Pro for unlimited access.', limitReached: true });
      }
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) return res.status(500).json({ error: 'Gemini API key is not configured.' });

    let systemInstruction = '';
    let finalPrompt = '';

    if (mode === 'fit') {
      systemInstruction = `You are a world-class legal draftsman.
Your job is to restructure the user's provided details into the standard sections, order, and clause layout of the requested legal template.

CRITICAL RULES:
1. PRESERVE CONTENT: Retain all names, dates, financial sums, addresses, and specific conditions. Do not remove any factual details.
2. STRICT TEMPLATE STRUCTURE: Match the template's structure exactly (e.g. headers, numbering, and signature blocks).
3. NO HALLUCINATIONS: Do not invent any new substantive clauses, terms, or conditions that weren't present in the user's source text.
4. NO PREAMBLE: Output ONLY the clean, final restructured document. No warnings, no explanation, no chat, no markdown.`;

      finalPrompt = `Template structure:\n${templateContent}\n\nUser details to fit in:\n${userContent}`;
    } else {
      systemInstruction = `You are a world-class legal draftsman specialising in Nigerian law.
Your job is to generate a comprehensive, professional draft of the legal document described by the user.

CRITICAL RULES:
1. NIGERIAN LAW COMPLIANCE: Use appropriate legal phrasing and standard terms under Nigerian jurisdiction (e.g. Land Use Act, Tenancy Law, Stamp Duties Act).
2. LEAVE PLACEHOLDERS: For any details not provided in the user's description (like dates, specific addresses, or serial numbers), leave clear uppercase placeholders in square brackets, e.g. [DATE], [PROPERTY ADDRESS].
3. PROFESSIONAL FORMATTING: Format with proper indentations, numbering, headers, and signature blocks.
4. NO PREAMBLE: Output ONLY the clean, generated draft. No warnings, no explanation, no chat, no markdown.`;

      finalPrompt = `Draft request details:\n${prompt}`;
    }

    const outputText = await callGemini(geminiKey, finalPrompt, systemInstruction);
    const sessionId = nanoid(21);

    // Save generated draft to DB history
    const { error: dbErr } = await db.from('documents').insert([{
      id: sessionId,
      email,
      transcript_text: outputText,
      source_image_count: 0,
      title: mode === 'fit' ? 'Restructured Template' : 'AI Drafted Document',
      type: 'transcription'
    }]);

    if (dbErr) console.error('Save draft error:', dbErr.message);

    return res.json({ success: true, text: outputText, sessionId });
  } catch (err) {
    console.error('Draft handler error:', err);
    return res.status(500).json({ error: err.message || 'Draft generation failed.' });
  }
};
