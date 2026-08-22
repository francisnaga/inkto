const Anthropic = require('@anthropic-ai/sdk');
const multer = require('multer');
const { Redis } = require('@upstash/redis');
const { nanoid } = require('nanoid');
const { supabase } = require('./_utils/supabase');

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

const SYSTEM_PROMPT_PASS_1 = `You are a world-class legal document transcription AI specialising in messy handwritten Nigerian court documents, affidavits, and police reports. 
Your sole purpose is to produce a flawless, 100% accurate text transcription of the provided image(s).

CRITICAL TRANSCRIPTION RULES:
1. CROSSED-OUT TEXT: Any text that has been struck through, crossed out, or scribbled over by the writer is CANCELLED. OMIT it completely. Do not transcribe it, do not mention it, do not include it.
2. INSERTIONS & CARETS: When a writer uses a caret (^), a triangle/chevron mark (∧), or writes text above a line to insert a word, you MUST include that inserted word at the exact correct position in the sentence.
3. ABSOLUTE ACCURACY: Transcribe all remaining text exactly as written. Preserve all original spelling, capitalisation, punctuation, abbreviations, numbering, and paragraph structure. Do not "fix" grammar if it was written incorrectly.
4. UNCLEAR WORDS: Do not hallucinate words. If a word is genuinely illegible, transcribe your best logical guess based on the legal context and add [?] immediately after it.
5. MULTIPLE PAGES: Treat them as sequential pages of one document, separated by: --- Page X ---
6. STRUCTURED OUTPUT: If the document contains numbered or lettered lists, preserve the exact numbering on distinct lines. If the document contains label/value pairs or itemized accounting (e.g. "12mm rods = N163,800"), format them as distinct structured lines so they can be parsed as tables, rather than merging them into prose.
7. NO CHATTER: Output ONLY the clean, final transcribed text. No preamble, no commentary, no markdown formatting (unless it was in the text).`;

const SYSTEM_PROMPT_PASS_2 = `You are a strict accuracy verification AI. 
You are given the original handwritten images AND a draft transcription.
Your task is to re-check EVERY number, amount, date, and proper noun in the draft against the images.
Correct any mismatches. Ensure absolute perfection for financial and legal figures.
If the document contains lists or itemized accounts, ensure they remain distinctly formatted on separate lines.
Return ONLY the final corrected transcript text. No preamble or commentary.`;

function sanitize(str) {
    return (str || '').replace(/[^\x20-\x7E]/g, '').trim();
}

// Wraps a promise with a timeout that rejects after ms milliseconds
function withTimeout(promise, ms, label) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
        promise.then(
            val => { clearTimeout(timer); resolve(val); },
            err => { clearTimeout(timer); reject(err); }
        );
    });
}

// Generate with specific provider
async function generateTranscription(provider, apiKey, dataBlocks, userText, pass) {
    const prompt = pass === 2 ? SYSTEM_PROMPT_PASS_2 : SYSTEM_PROMPT_PASS_1;
    
    if (provider === 'anthropic') {
        const anthropic = new Anthropic.default({ apiKey });
        const response = await anthropic.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 8192,
            temperature: 0.1,
            system: prompt,
            messages: [{ role: 'user', content: [...dataBlocks, { type: 'text', text: userText }] }]
        });
        return response.content[0].text;
    } else {
        const parts = [
            ...dataBlocks.map(b => ({ inlineData: { mimeType: b.source.media_type, data: b.source.data } })),
            { text: userText }
        ];
        // Use known-good Gemini 3.7 Flash model with a fallback
        const modelChain = ['gemini-3.7-flash', 'gemini-3.5-flash-lite'];
        let lastErr = null;
        for (const model of modelChain) {
            try {
                const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
                const res = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    signal: AbortSignal.timeout(26000), // Prevent hanging on overloaded models
                    body: JSON.stringify({
                        contents: [{ role: 'user', parts }],
                        systemInstruction: { role: 'system', parts: [{ text: prompt }] },
                        generationConfig: { temperature: 0.1 }
                    })
                });
                
                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data.error?.message || JSON.stringify(data));
                }
                
                return data.candidates[0].content.parts[0].text;
            } catch (err) {
                lastErr = err;
                console.warn(`Gemini ${model} REST API failed:`, err.message.substring(0, 150));
                // Brief pause before trying fallback model
                await new Promise(r => setTimeout(r, 500));
            }
        }
        throw lastErr || new Error('All Gemini models failed');
    }
}

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    // ---- IP Rate Limiting ----
    if (redis) {
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
        if (ip !== 'unknown') {
            const rlKey = `rate_limit:transcribe:${ip}`;
            try {
                const count = await redis.incr(rlKey);
                if (count === 1) await redis.expire(rlKey, 3600);
                if (count > 10) return res.status(429).json({ error: 'Too many requests. Please try again in an hour.' });
            } catch (err) { console.error('Rate limit error:', err); }
        }
    }

    try { await runMiddleware(req, res, upload.array('files', 30)); } 
    catch (err) { return res.status(400).json({ error: `Upload error: ${err.message}` }); }

    const files = req.files;
    if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No valid files received.' });
    }

    const dataBlocks = files.map(file => {
        let mediaType = file.mimetype === 'image/jpg' ? 'image/jpeg' : file.mimetype;
        return {
            type: mediaType === 'application/pdf' ? 'document' : 'image',
            source: { type: 'base64', media_type: mediaType, data: file.buffer.toString('base64') }
        };
    });

    const userInstructions = req.body && req.body.prompt ? `Additional instructions: ${req.body.prompt}` : '';
    const pass1UserText = `Transcribe all pages of this handwritten document. ${userInstructions}`;

    const anthropicKey = sanitize(process.env.ANTHROPIC_API_KEY);
    const geminiKey = sanitize(process.env.GEMINI_API_KEY);

    if (!anthropicKey && !geminiKey) {
        return res.status(500).json({ error: 'No API keys configured on the server.' });
    }

    try {
        let draftText = '';
        const providers = [];
        
        // PASS 1
        if (anthropicKey) providers.push(withTimeout(generateTranscription('anthropic', anthropicKey, dataBlocks, pass1UserText, 1), 45000, 'Anthropic'));
        if (geminiKey) providers.push(withTimeout(generateTranscription('gemini', geminiKey, dataBlocks, pass1UserText, 1), 55000, 'Gemini'));
        
        draftText = await Promise.any(providers);
        
        // PASS 2 (Accuracy Verification)
        const pass2UserText = `Here is the draft transcript:\n\n---\n${draftText}\n---\n\nPlease verify and correct it according to the instructions.`;
        const providersPass2 = [];
        if (anthropicKey) providersPass2.push(withTimeout(generateTranscription('anthropic', anthropicKey, dataBlocks, pass2UserText, 2), 45000, 'Anthropic'));
        if (geminiKey) providersPass2.push(withTimeout(generateTranscription('gemini', geminiKey, dataBlocks, pass2UserText, 2), 55000, 'Gemini'));
        
        let finalText = await Promise.any(providersPass2);

        // Detect when AI says there's no handwritten text and normalise it
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
        if (isNoText) {
            finalText = '[No handwritten text found in this document. Please upload a clear photo of a handwritten page.]';
        }

        // Upload images to Supabase Storage and Save document to DB
        const sessionId = (req.body && req.body.sessionId) ? req.body.sessionId : nanoid(21);
        const startIndex = (req.body && req.body.startIndex) ? parseInt(req.body.startIndex, 10) : 0;
        const isFinalBatch = (req.body && req.body.isFinalBatch === 'true');
        const totalFilesCount = (req.body && req.body.totalFilesCount) ? parseInt(req.body.totalFilesCount, 10) : files.length;
        
        const db = require('./_utils/supabase').checkSupabase();
        
        // Upload images asynchronously
        await Promise.all(files.map(async (file, index) => {
            const ext = file.mimetype === 'image/jpeg' ? 'jpg' : 
                        file.mimetype === 'image/png' ? 'png' : 
                        file.mimetype === 'application/pdf' ? 'pdf' : 'bin';
            const filePath = `${sessionId}/${startIndex + index}.${ext}`;
            
            await db.storage.from('inkto-images').upload(filePath, file.buffer, {
                contentType: file.mimetype,
                upsert: true
            });
        }));

        // In a chunked scenario, we only want to save the complete document on the final batch.
        if (!req.body || !req.body.sessionId) {
            // Legacy/non-chunked request
            const { error: dbError } = await db.from('documents').insert([{
                id: sessionId,
                transcript_text: finalText,
                source_image_count: files.length
            }]);
            if (dbError) console.error('Failed to save to Supabase Postgres:', dbError);
        } else if (isFinalBatch) {
            // Chunked request: fullTranscript = all previous batches, finalText = this batch
            const previousText = req.body.fullTranscript || '';
            const completeTranscript = previousText
                ? previousText + '\n\n---\n\n' + finalText
                : finalText;
            const { error: dbError } = await db.from('documents').insert([{
                id: sessionId,
                transcript_text: completeTranscript,
                source_image_count: totalFilesCount
            }]);
            if (dbError) console.error('Failed to save chunked transcript to Postgres:', dbError);
        }

        return res.json({ success: true, text: finalText, sessionId });
    } catch (err) {
        console.error('Transcription failed:', err.errors || err.message);
        return res.status(500).json({
            error: 'The transcription service is currently busy. Please try again in a few seconds.',
            details: err.message,
            stack: err.stack,
            aggregateErrors: err.errors ? err.errors.map(e => e.message) : undefined
        });
    }
};

module.exports.config = {
    api: { bodyParser: false }
};
