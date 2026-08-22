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
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/gif', 'application/pdf'];
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
async function callGemini(apiKey, parts, timeoutMs) {
    // Model chain: try primary first, fall back to lite
    const models = ['gemini-3.5-flash', 'gemini-3.5-flash-lite'];

    for (const model of models) {
        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), timeoutMs);

            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal,
                body: JSON.stringify({
                    contents: [{ role: 'user', parts }],
                    systemInstruction: { role: 'system', parts: [{ text: SYSTEM_PROMPT }] },
                    generationConfig: { temperature: 0.1, maxOutputTokens: 8192 }
                })
            });
            clearTimeout(timer);

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

    throw new Error('All Gemini models unavailable. Please try again in a moment.');
}

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

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

    // Build image parts for Gemini
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
    const pageInstruction = isSinglePageRequest
        ? `Transcribe exactly this one page. It is page ${requestedPageNumber} of ${totalPages}. Output only the text visible on this page. Do not output a page heading. Do not repeat any previous page or continue into any next page.${userInstructions}`
        : `Transcribe these ${files.length} pages in the exact order provided, starting at page ${requestedPageNumber} of ${totalPages}. Do not repeat pages or invent missing pages.${userInstructions}`;
    parts.push({ text: pageInstruction });

    try {
        // Single-pass transcription — fast, lean, reliable
        // Reserve 50s for the AI call (leaving 10s headroom under Vercel's 60s limit)
        const finalText = cleanSinglePageText(await callGemini(geminiKey, parts, 50000));

        // Detect blank/no-text responses
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
        const outputText = isNoText
            ? '[No handwritten text found in this document. Please upload a clear photo of a handwritten page.]'
            : finalText;

        // Save to Supabase
        const sessionId = req.body?.sessionId || nanoid(21);
        const isFinalBatch = req.body?.isFinalBatch === 'true';

        try {
            const { checkSupabase } = require('./_utils/supabase');
            const db = checkSupabase();

            // Upload images
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

            // Save transcript
            if (!req.body?.sessionId) {
                // Non-chunked: save immediately
                const { error: dbErr } = await db.from('documents').insert([{
                    id: sessionId,
                    transcript_text: outputText,
                    source_image_count: files.length
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
                    transcript_text: complete,
                    source_image_count: totalFilesCount
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
