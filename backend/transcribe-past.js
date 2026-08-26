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

const SYSTEM_PROMPT = `You are a world-class legal document transcription AI specialising in messy handwritten Nigerian court documents, affidavits, and police reports.
Your sole purpose is to produce a flawless, 100% accurate text transcription of the provided document.

CRITICAL TRANSCRIPTION RULES:
1. CROSSED-OUT TEXT: Any text that has been struck through, crossed out, or scribbled over by the writer is CANCELLED. OMIT it completely.
2. INSERTIONS & CARETS: Include inserted words at the exact correct position in the sentence.
3. ABSOLUTE ACCURACY: Transcribe all remaining text exactly as written. Preserve all spelling, capitalisation, punctuation, abbreviations, and paragraph structure.
4. UNCLEAR WORDS: Do not hallucinate. If a word is illegible, transcribe your best logical guess and add [?] immediately after it.
5. NO CHATTER: Output ONLY the clean, final transcribed text. No preamble, no commentary, no markdown.`;

const VOICE_SYSTEM_PROMPT = `You are a world-class legal transcription AI specialising in transcribing Nigerian legal recordings, dictation, and court proceedings.
Your sole purpose is to produce a verbatim, 100% accurate text transcription of the provided audio.

CRITICAL VOICE TRANSCRIPTION RULES:
1. VERBATIM ACCURACY: Transcribe the audio exactly as spoken. Do not paraphrase, summarize, or alter statements.
2. NIGERIAN CONTEXT: Accurately transcribe Nigerian names, legal terms, places, case names, and citations (e.g., FSC, Supreme Court, Laws of the Federation of Nigeria).
3. CODE SWITCHING & PIDGIN: If speakers use Nigerian Pidgin or switch into local languages, transcribe those phrases accurately as spoken.
4. FILLER WORDS: Clean up basic vocal filler words (like "um", "ah", "you know") to make it readable, unless in formal testimony where exact phrasing matters.
5. NO CHATTER: Output ONLY the clean transcribed text. No preamble, no commentary, no markdown formatting.`;

async function callGemini(apiKey, parts, systemPrompt = SYSTEM_PROMPT) {
  const models = ['gemini-3.5-flash-lite', 'gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-2.5-flash', 'gemini-1.5-flash'];
  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts }],
          systemInstruction: { role: 'system', parts: [{ text: systemPrompt }] },
          generationConfig: { temperature: 0.1, maxOutputTokens: 4096 }
        })
      });
      const data = await res.json();
      if (!res.ok) continue;
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
    } catch (e) {
      console.warn(`Gemini ${model} failed in background:`, e);
    }
  }
  throw new Error('All Gemini transcription fallback models failed. Please try again.');
}

module.exports = async function handler(req, res) {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cookie, Authorization, X-Inkto-Auth');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const email = require('./_utils/auth').getAuthEmail(req);
  if (!email) return res.status(401).json({ error: 'Unauthorized', requireAuth: true });

  const { id, fileUrl, title } = req.body || {};
  if (!fileUrl) return res.status(400).json({ error: 'fileUrl is required.' });

  try {
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) return res.status(500).json({ error: 'Service is not configured.' });

    const db = require('./_utils/supabase').checkSupabase();

    // 1. Fetch document type if ID is available
    let existingDoc = null;
    if (id) {
      const { data } = await db.from('documents').select('*').eq('id', id).single();
      existingDoc = data;
    }

    const isAudio = existingDoc?.type === 'voice' ||
                    fileUrl.includes('audio.') ||
                    fileUrl.toLowerCase().endsWith('.wav') ||
                    fileUrl.toLowerCase().endsWith('.mp3') ||
                    fileUrl.toLowerCase().endsWith('.m4a') ||
                    fileUrl.toLowerCase().endsWith('.webm');

    // 2. Download file from storage
    const fileRes = await fetch(fileUrl);
    if (!fileRes.ok) throw new Error('Could not retrieve file from cloud storage.');
    const arrayBuffer = await fileRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Determine mime type based on URL extension
    let mimeType = isAudio ? 'audio/wav' : 'application/pdf';
    if (!isAudio) {
      if (fileUrl.toLowerCase().endsWith('.jpg') || fileUrl.toLowerCase().endsWith('.jpeg')) mimeType = 'image/jpeg';
      else if (fileUrl.toLowerCase().endsWith('.png')) mimeType = 'image/png';
      else if (fileUrl.toLowerCase().endsWith('.webp')) mimeType = 'image/webp';
    } else {
      if (fileUrl.toLowerCase().endsWith('.mp3')) mimeType = 'audio/mp3';
      else if (fileUrl.toLowerCase().endsWith('.m4a')) mimeType = 'audio/x-m4a';
      else if (fileUrl.toLowerCase().endsWith('.webm')) mimeType = 'audio/webm';
    }

    // 3. Call Gemini
    const parts = [{
      inlineData: {
        mimeType,
        data: buffer.toString('base64')
      }
    }];

    const systemPrompt = isAudio ? VOICE_SYSTEM_PROMPT : SYSTEM_PROMPT;
    const transcription = await callGemini(geminiKey, parts, systemPrompt);

    // 4. Update existing or Save new transcription document
    if (isAudio && id) {
      const { error: dbErr } = await db
        .from('documents')
        .update({ transcript_text: transcription })
        .eq('id', id);

      if (dbErr) throw dbErr;
      return res.json({ success: true, id, text: transcription });
    } else {
      const docId = nanoid(21);
      const { error: dbErr } = await db.from('documents').insert([{
        id: docId,
        email: email.toLowerCase(),
        type: 'transcription',
        title: title ? `Converted: ${title}` : 'Converted Document',
        transcript_text: transcription
      }]);

      if (dbErr) throw dbErr;
      return res.json({ success: true, id: docId, text: transcription });
    }
  } catch (err) {
    console.error('Transcribe past error:', err);
    return res.status(500).json({ error: err.message || 'Conversion failed.' });
  }
};
