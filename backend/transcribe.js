const multer = require('multer');
const { Redis } = require('@upstash/redis');
const { nanoid } = require('nanoid');

// ---- Redis Setup ----
const redis = process.env.UPSTASH_REDIS_REST_KV_REST_API_URL
    ? new Redis({ url: process.env.UPSTASH_REDIS_REST_KV_REST_API_URL, token: process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN })
    : null;

// ---- Multer: memory storage ----
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 25 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = [
            'image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/gif', 'application/pdf',
            'audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/m4a', 'audio/webm', 'audio/3gpp', 'audio/ogg', 'audio/aac', 'audio/x-m4a', 'audio/mp4'
        ];
        cb(null, allowed.includes(file.mimetype));
    }
});

function runMiddleware(req, res, fn) {
    return new Promise((resolve, reject) => {
        fn(req, res, (result) => {
            if (result instanceof Error) reject(result);
            else resolve(result);
        });
    });
}

const SYSTEM_PROMPT = `You are a world-class legal document transcription AI specialising in messy handwritten Nigerian court documents, affidavits, and police reports.
Your sole purpose is to produce a flawless, 100% accurate text transcription of the provided image(s).

CRITICAL TRANSCRIPTION RULES:
1. CROSSED-OUT TEXT: Any text that has been struck through, crossed out, or scribbled over by the writer is CANCELLED. OMIT it completely. Do not transcribe it, do not mention it, do not include it.
2. INSERTIONS & CARETS: When a writer uses a caret (^), a triangle/chevron mark (∧), or writes text above a line to insert a word, you MUST include that inserted word at the exact correct position in the sentence.
3. ABSOLUTE ACCURACY: Transcribe all remaining text exactly as written. Preserve all original spelling, capitalisation, punctuation, abbreviations, numbering, and paragraph structure. Do not "fix" grammar if it was written incorrectly.
4. UNCLEAR WORDS: Do not hallucinate words. If a word is genuinely illegible, transcribe your best logical guess based on the legal context and add [?] immediately after it.
5. PAGE BOUNDARIES: Only transcribe the image(s) provided in the current request. Never repeat earlier pages, never invent missing pages, and never add page headings unless the user explicitly asks for headings.
6. STRUCTURED OUTPUT: If the document contains numbered or lettered lists, preserve the exact numbering on distinct lines. If the document contains label/value pairs or itemized accounting (e.g. "12mm rods = N163,800"), format them as distinct structured lines so they can be parsed as tables, rather than merging them into prose.
7. NO CHATTER: Output ONLY the clean, final transcribed text. No preamble, no commentary, no markdown formatting (unless it was in the text).`;

const VOICE_SYSTEM_PROMPT = `You are a world-class legal transcription AI specialising in transcribing Nigerian legal recordings, dictation, and court proceedings.
Your sole purpose is to produce a verbatim, 100% accurate text transcription of the provided audio.

CRITICAL VOICE TRANSCRIPTION RULES:
1. VERBATIM ACCURACY: Transcribe the audio exactly as spoken. Do not paraphrase, summarize, or alter statements.
2. NIGERIAN CONTEXT: Accurately transcribe Nigerian names, legal terms, places, case names, and citations (e.g., FSC, Supreme Court, Laws of the Federation of Nigeria).
3. CODE SWITCHING & PIDGIN: If speakers use Nigerian Pidgin or switch into local languages, transcribe those phrases accurately as spoken.
4. FILLER WORDS: Clean up basic vocal filler words (like "um", "ah", "you know") to make it readable, unless in formal testimony where exact phrasing matters.
5. NO CHATTER: Output ONLY the clean transcribed text. No preamble, no commentary, no markdown formatting.`;

function sanitize(str) {
    return (str || '').replace(/[^\x20-\x7E]/g, '').trim();
}

function cleanSinglePageText(text) {
    return (text || '')
        .replace(/^\s*-{2,}\s*Page\s+\d+\s*-{2,}\s*/i, '')
        .replace(/^\s*Page\s+\d+\s*:?\s*/i, '')
        .trim();
}

// Call Gemini REST API directly — bypasses SDK OAuth bugs
async function callGemini(apiKey, parts, timeoutMs, systemPrompt = SYSTEM_PROMPT) {
    // Model chain: prefer low-latency multimodal models, then fall back.
    const models = ['gemini-3.5-flash-lite', 'gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-2.5-flash', 'gemini-1.5-flash'];
    const deadline = Date.now() + timeoutMs;

    for (const model of models) {
        const remainingMs = deadline - Date.now();
        if (remainingMs < 6000) break;

        try {
            const controller = new AbortController();
            const modelTimeoutMs = Math.min(remainingMs, model.includes('lite') ? 24000 : 18000);
            const timer = setTimeout(() => controller.abort(), modelTimeoutMs);

            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            let res;
            try {
                res = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    signal: controller.signal,
                    body: JSON.stringify({
                        contents: [{ role: 'user', parts }],
                        systemInstruction: { role: 'system', parts: [{ text: systemPrompt }] },
                        generationConfig: { temperature: 0.1, maxOutputTokens: 4096 }
                    })
                });
            } finally {
                clearTimeout(timer);
            }

            const data = await res.json();
            if (!res.ok) {
                const msg = data.error?.message || JSON.stringify(data);
                console.warn(`[Inkto] Gemini ${model} error ${res.status}: ${msg.substring(0, 200)}`);
                // 503 = overloaded, try next model. 401/403 = bad key, stop trying.
                if (res.status === 401 || res.status === 403) {
                    throw new Error(`Gemini auth error: ${msg}`);
                }
                continue; // try next model
            }

            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!text) throw new Error('Gemini returned an empty response');
            console.log(`[Inkto] Success with ${model}`);
            return text;

        } catch (err) {
            const isAbort = err.name === 'AbortError';
            console.warn(`[Inkto] Gemini ${model} ${isAbort ? 'timed out' : 'failed'}: ${err.message?.substring(0, 150)}`);
            // If auth error, don't bother trying next model
            if (err.message?.includes('auth error')) throw err;
            // Otherwise try next model
        }
    }

    throw new Error('This page took too long to transcribe. Please retry, or upload a clearer/lower-resolution image for this page.');
}

module.exports = async function handler(req, res) {
    const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Inkto-Auth, Cookie');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    // ---- Auth & Tier Check (server-side, Rule 6: cannot be bypassed via API) ----
    const parseCookie = (str) => {
        if (!str) return {};
        return str.split(';').reduce((res, c) => {
            const idx = c.indexOf('='); if (idx < 0) return res;
            const key = c.slice(0, idx).trim();
            const val = c.slice(idx + 1).trim();
            try { res[key] = decodeURIComponent(val); } catch { res[key] = val; }
            return res;
        }, {});
    };

    const verifyCookie = (cookieValue) => {
        if (!cookieValue) return null;
        const lastColon = cookieValue.lastIndexOf(':');
        const secondLastColon = cookieValue.lastIndexOf(':', lastColon - 1);
        if (lastColon < 0 || secondLastColon < 0) return null;
        const email = cookieValue.slice(0, secondLastColon);
        const expiresStr = cookieValue.slice(secondLastColon + 1, lastColon);
        const signature = cookieValue.slice(lastColon + 1);
        const expires = parseInt(expiresStr, 10);
        if (!email || isNaN(expires) || Date.now() > expires) return null;
        const data = `${email}:${expires}`;
        const COOKIE_SECRET = process.env.COOKIE_SECRET || process.env.SUPABASE_ANON_KEY || 'inkto-default-secret';
        const expectedSig = require('crypto').createHmac('sha256', COOKIE_SECRET).update(data).digest('hex');
        if (signature.length !== expectedSig.length) return null;
        try {
            if (!require('crypto').timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) return null;
        } catch { return null; }
        return email;
    };

    const cookies = parseCookie(req.headers.cookie || '');
    const userEmail = await require('./_utils/auth').getAuthEmail(req);

    if (!userEmail) {
        return res.status(401).json({ error: 'Please sign in to convert documents.', requireAuth: true });
    }

    // ---- Free-tier daily limit: 5 conversions/day (server-side per Rule 6) ----
    // This is only enforced for non-finalize calls (actual AI calls, not the save step)
    const isFinalize = req.headers['content-type']?.includes('application/json') && req.body?.action === 'finalize';

    if (!isFinalize) {
        try {
            const db = require('./_utils/supabase').checkSupabase();

            // Check subscription status
            let userRow = null;
            try {
                const { data, error } = await db
                    .from('users')
                    .select('subscription_status, plan_expires_at, is_pro')
                    .eq('email', userEmail)
                    .single();
                if (error && (error.code === '42703' || error.message?.includes('does not exist'))) {
                    const fallback = await db
                        .from('users')
                        .select('subscription_status, plan_expires_at')
                        .eq('email', userEmail)
                        .single();
                    userRow = fallback.data;
                } else {
                    userRow = data;
                }
            } catch {}

            const isPaid = userRow?.is_pro === true || (userRow?.subscription_status === 'active' && userRow?.plan_expires_at && new Date(userRow.plan_expires_at) > new Date());

            if (!isPaid) {
                // Count today's AI transcription calls for this user
                const today = new Date(); today.setHours(0, 0, 0, 0);
                const { count } = await db
                    .from('documents')
                    .select('id', { count: 'exact', head: true })
                    .eq('email', userEmail)
                    .gte('created_at', today.toISOString());

                if (count !== null && count >= 5) {
                    return res.status(429).json({
                        error: 'You have used your 5 free conversions for today. Upgrade to Pro for unlimited access.',
                        limitReached: true
                    });
                }
            }
        } catch (err) {
            // DB check failure should not block the request if it's a temporary error
            console.error('Tier check error (non-fatal):', err.message);
        }
    }

    if (isFinalize) {
        try {
            const db = require('./_utils/supabase').checkSupabase();
            const { sessionId, text, totalFilesCount } = req.body || {};
            if (!sessionId || !text) {
                return res.status(400).json({ error: 'sessionId and text are required for finalize' });
            }

            const lines = text.split('\n').filter(Boolean);
            const firstLine = lines.length > 0 ? lines[0].replace(/^--- Page \d+ ---\s*/i, '').substring(0, 80) : 'Legal Transcription';
            const autoTitle = firstLine.trim() || 'Legal Transcription';

            const { data, error: dbErr } = await db.from('documents').upsert([{
                id: sessionId,
                email: userEmail.toLowerCase(),
                transcript_text: text,
                source_image_count: Number(totalFilesCount) || 1,
                title: autoTitle,
                type: 'transcription'
            }], { onConflict: 'id' });

            if (dbErr) {
                console.error('Supabase finalize insert error:', dbErr.message);
                return res.status(500).json({ error: dbErr.message });
            }

            return res.json({ success: true, sessionId, message: 'Document saved to history' });
        } catch (err) {
            console.error('Finalize error:', err.message);
            return res.status(500).json({ error: err.message });
        }
    }

    // ---- IP Rate Limiting ----
    if (redis) {
        const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
        if (ip !== 'unknown') {
            const rlKey = `rate_limit:transcribe:${ip}`;
            try {
                const count = await redis.incr(rlKey);
                if (count === 1) await redis.expire(rlKey, 3600);
                if (count > 120) return res.status(429).json({ error: 'Too many pages processed from this network in the last hour. Please try again later.' });
            } catch (err) { console.error('Rate limit error:', err); }
        }
    }

    try { await runMiddleware(req, res, upload.array('files', 30)); }
    catch (err) { return res.status(400).json({ error: `Upload error: ${err.message}` }); }

    const files = req.files;
    if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No valid files received.' });
    }

    const geminiKey = sanitize(process.env.GEMINI_API_KEY);
    if (!geminiKey) {
        return res.status(500).json({ error: 'Service is not configured. Please contact support.' });
    }

    const isAudio = files.some(file => file.mimetype.includes('audio') || file.mimetype.includes('mpeg') || file.mimetype.includes('webm') || file.mimetype.includes('wav'));

    // Build image or audio parts for Gemini
    const parts = files.map(file => {
        let mimeType = file.mimetype === 'image/jpg' ? 'image/jpeg' : file.mimetype;
        return {
            inlineData: {
                mimeType,
                data: file.buffer.toString('base64')
            }
        };
    });

    const startIndex = req.body?.startIndex ? parseInt(req.body.startIndex, 10) : 0;
    const requestedPageNumber = req.body?.pageNumber ? parseInt(req.body.pageNumber, 10) : startIndex + 1;
    const totalFilesCount = req.body?.totalFilesCount ? parseInt(req.body.totalFilesCount, 10) : files.length;
    const totalPages = req.body?.totalPages ? parseInt(req.body.totalPages, 10) : totalFilesCount;
    const isSinglePageRequest = files.length === 1;

    const userInstructions = req.body?.prompt ? `\n\nAdditional instructions: ${req.body.prompt}` : '';
    const pageInstruction = isAudio
        ? `Transcribe this audio recording verbatim. Output only the transcribed text.${userInstructions}`
        : (isSinglePageRequest
            ? `Transcribe exactly this one page. It is page ${requestedPageNumber} of ${totalPages}. Output only the text visible on this page. Do not output a page heading. Do not repeat any previous page or continue into any next page.${userInstructions}`
            : `Transcribe these ${files.length} pages in the exact order provided, starting at page ${requestedPageNumber} of ${totalPages}. Do not repeat pages or invent missing pages.${userInstructions}`);
    parts.push({ text: pageInstruction });

    try {
        let outputText = '';
        const isSaveRawAudio = req.body?.action === 'save_raw_audio';

        if (isSaveRawAudio) {
            outputText = '[Raw voice dictation - click Convert to Text below to transcribe]';
        } else {
            // Single-pass transcription — fast, lean, reliable
            // Reserve 50s for the AI call (leaving 10s headroom under Vercel's 60s limit)
            const systemPrompt = isAudio ? VOICE_SYSTEM_PROMPT : SYSTEM_PROMPT;
            const finalText = cleanSinglePageText(await callGemini(geminiKey, parts, 50000, systemPrompt));

            // Detect blank/no-text responses (only for images)
            outputText = finalText;
            if (!isAudio) {
                const noTextPhrases = [
                    'does not contain any handwritten',
                    'no handwritten text',
                    'cannot transcribe',
                    'no text to transcribe',
                    'does not appear to contain any text',
                    'the image does not contain',
                    'there is no text',
                    'no legible text',
                    'no written text'
                ];
                const isNoText = finalText.length < 400 && noTextPhrases.some(p => finalText.toLowerCase().includes(p));
                outputText = isNoText
                    ? '[No handwritten text found in this document. Please upload a clear photo of a handwritten page.]'
                    : finalText;
            }
        }

        // Save to Supabase
        const sessionId = req.body?.sessionId || nanoid(21);
        const isFinalBatch = req.body?.isFinalBatch === 'true';

        try {
            const { checkSupabase } = require('./_utils/supabase');
            const db = checkSupabase();

            // Upload media to storage
            let audioUrl = null;
            if (isAudio) {
                const ext = files[0].mimetype.split('/').pop() || 'mp3';
                const filePath = `${sessionId}/audio.${ext}`;
                await db.storage.from('inkto-images').upload(filePath, files[0].buffer, {
                    contentType: files[0].mimetype,
                    upsert: true
                });
                audioUrl = db.storage.from('inkto-images').getPublicUrl(filePath).data.publicUrl;
            } else {
                await Promise.all(files.map(async (file, index) => {
                    const ext = file.mimetype === 'image/jpeg' ? 'jpg'
                        : file.mimetype === 'image/png' ? 'png'
                        : file.mimetype === 'application/pdf' ? 'pdf' : 'bin';
                    const filePath = `${sessionId}/${startIndex + index}.${ext}`;
                    await db.storage.from('inkto-images').upload(filePath, file.buffer, {
                        contentType: file.mimetype,
                        upsert: true
                    });
                }));
            }

            // Save transcript
            if (!req.body?.sessionId || isAudio) {
                // Non-chunked / Audio: save immediately
                const { error: dbErr } = await db.from('documents').insert([{
                    id: sessionId,
                    email: userEmail,
                    transcript_text: outputText,
                    source_image_count: isAudio ? 0 : files.length,
                    type: isAudio ? 'voice' : 'transcription',
                    audio_url: audioUrl
                }]);
                if (dbErr) console.error('Supabase insert error:', dbErr);
            } else if (isFinalBatch) {
                // Final chunk: combine and save
                const prev = req.body.fullTranscript || '';
                const currentPageBlock = isSinglePageRequest
                    ? `--- Page ${requestedPageNumber} ---\n${outputText}`
                    : outputText;
                const complete = prev ? `${prev}\n\n${currentPageBlock}` : currentPageBlock;
                const { error: dbErr } = await db.from('documents').insert([{
                    id: sessionId,
                    email: userEmail,
                    transcript_text: complete,
                    source_image_count: totalFilesCount,
                    type: 'transcription'
                }]);
                if (dbErr) console.error('Supabase chunked insert error:', dbErr);
            }
        } catch (dbErr) {
            // DB failure should not kill the response — user still gets their transcript
            console.error('Supabase error (non-fatal):', dbErr.message);
        }

        return res.json({ success: true, text: outputText, sessionId });

    } catch (err) {
        console.error('[Inkto] Transcription failed:', err.message);
        return res.status(500).json({
            error: 'Transcription failed. Please try again.',
            details: err.message
        });
    }
};

module.exports.config = {
    api: { bodyParser: false }
};
