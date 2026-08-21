const Anthropic = require('@anthropic-ai/sdk');
const { GoogleGenAI } = require('@google/genai');
const multer = require('multer');
const { Redis } = require('@upstash/redis');
const { nanoid } = require('nanoid');
const { supabase } = require('./utils/supabase');

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
        const gemini = new GoogleGenAI({ apiKey });
        const parts = [
            ...dataBlocks.map(b => ({ inlineData: { mimeType: b.source.media_type, data: b.source.data } })),
            { text: userText }
        ];
        const modelChain = ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite'];
        for (const model of modelChain) {
            try {
                const response = await gemini.models.generateContent({
                    model,
                    contents: [{ role: 'user', parts }],
                    config: { systemInstruction: prompt, temperature: 0.1 }
                });
                return response.text;
            } catch (err) {
                console.warn(`Gemini ${model} failed:`, err.message.substring(0, 100));
            }
        }
        throw new Error('All Gemini models failed');
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
        
        const finalText = await Promise.any(providersPass2);

        // Upload images to Supabase Storage and Save document to DB
        const sessionId = nanoid(21);
        
        // Upload images asynchronously
        await Promise.all(files.map(async (file, index) => {
            const ext = file.mimetype === 'image/jpeg' ? 'jpg' : 
                        file.mimetype === 'image/png' ? 'png' : 
                        file.mimetype === 'application/pdf' ? 'pdf' : 'bin';
            const filePath = `${sessionId}/${index}.${ext}`;
            
            await supabase.storage.from('inkto-images').upload(filePath, file.buffer, {
                contentType: file.mimetype,
                upsert: true
            });
        }));

        // Insert into postgres documents table (email is nullable)
        const { error: dbError } = await supabase.from('documents').insert([{
            id: sessionId,
            transcript_text: finalText,
            source_image_count: files.length
        }]);

        if (dbError) {
            console.error('Failed to save to Supabase Postgres:', dbError);
        }

        return res.json({ success: true, text: finalText, sessionId });
    } catch (err) {
        console.error('Transcription failed:', err.errors || err.message);
        return res.status(500).json({
            error: 'AI is temporarily unavailable. Please tap Try Again — it usually recovers quickly.'
        });
    }
};

module.exports.config = {
    api: { bodyParser: false }
};
