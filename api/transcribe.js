const Anthropic = require('@anthropic-ai/sdk');
const { GoogleGenAI } = require('@google/genai');
const multer = require('multer');

// ---- Multer: memory storage ----
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 25 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/gif'];
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

const SYSTEM_PROMPT = `You are an expert legal document transcription assistant specialising in handwritten Nigerian court documents.

TRANSCRIPTION RULES:
1. CROSSED-OUT TEXT: Any text that has been struck through or crossed out by the writer is CANCELLED. OMIT it completely — do not transcribe it, do not note it, do not include it in any form.
2. INSERTIONS: When a writer uses a caret (^), a triangle/chevron mark (∧), or writes text above a line with an arrow or insertion mark, include that inserted word or phrase at the correct position in the sentence, naturally woven into the text.
3. ACCURACY: Transcribe all remaining text exactly as written, preserving original capitalisation, punctuation, numbering and paragraph structure.
4. UNCLEAR WORDS: If a word is genuinely illegible, transcribe your best guess and add [?] immediately after it.
5. MULTIPLE PAGES: Treat them as sequential pages of one document, separated by: --- Page X ---
6. OUTPUT: Output ONLY the clean, final transcribed text. No preamble, no commentary, no notes about what you did.`;

function sanitize(str) {
    return (str || '').replace(/[^\x20-\x7E]/g, '').trim();
}

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    // Parse multipart
    try {
        await runMiddleware(req, res, upload.array('files', 30));
    } catch (err) {
        return res.status(400).json({ error: `Upload error: ${err.message}` });
    }

    const files = req.files;
    if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No image files received. Please upload JPG, PNG, or WEBP images.' });
    }

    // ---- Build image blocks ----
    const imageBlocks = files.map(file => {
        let mediaType = file.mimetype === 'image/jpg' ? 'image/jpeg' : file.mimetype;
        return {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: file.buffer.toString('base64') }
        };
    });

    const userText = req.body && req.body.prompt
        ? `Transcribe all pages. Additional instructions: ${req.body.prompt}`
        : 'Transcribe all pages of this handwritten document.';

    console.log(`Received ${files.length} file(s) for transcription`);

    // ---- Try Anthropic ----
    const anthropicKey = sanitize(process.env.ANTHROPIC_API_KEY);
    if (anthropicKey) {
        try {
            console.log('Trying Anthropic...');
            const anthropic = new Anthropic.default({ apiKey: anthropicKey });
            const response = await anthropic.messages.create({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 8192,
                system: SYSTEM_PROMPT,
                messages: [{ role: 'user', content: [...imageBlocks, { type: 'text', text: userText }] }]
            });
            console.log('Anthropic succeeded.');
            return res.json({ success: true, text: response.content[0].text });
        } catch (err) {
            console.error('Anthropic failed:', err.message);
        }
    }

    // ---- Fallback: Gemini ----
    const geminiKey = sanitize(process.env.GEMINI_API_KEY);
    if (!geminiKey) {
        return res.status(500).json({ error: 'No API keys configured. Add ANTHROPIC_API_KEY or GEMINI_API_KEY to Vercel environment variables.' });
    }

    try {
        console.log('Trying Gemini (3.6-flash)...');
        const gemini = new GoogleGenAI({ apiKey: geminiKey });
        const parts = [
            ...imageBlocks.map(b => ({ inlineData: { mimeType: b.source.media_type, data: b.source.data } })),
            { text: userText }
        ];
        
        try {
            const response = await gemini.models.generateContent({
                model: 'gemini-3.6-flash',
                contents: [{ role: 'user', parts }],
                config: { systemInstruction: SYSTEM_PROMPT }
            });
            console.log('Gemini 3.6 succeeded.');
            return res.json({ success: true, text: response.text });
        } catch (geminiErr) {
            console.warn('Gemini 3.6 failed, trying 1.5-flash:', geminiErr.message);
            // Fallback to 1.5-flash if 3.6 is overloaded
            const fallbackResponse = await gemini.models.generateContent({
                model: 'gemini-1.5-flash',
                contents: [{ role: 'user', parts }],
                config: { systemInstruction: SYSTEM_PROMPT }
            });
            console.log('Gemini 1.5 succeeded.');
            return res.json({ success: true, text: fallbackResponse.text });
        }
    } catch (err) {
        console.error('All Gemini attempts failed:', err.message);
        
        let errorMsg = err.message;
        try {
            // Try to parse the Google API error JSON if it's embedded in the message
            const match = err.message.match(/(\{.*\})/);
            if (match) {
                const parsed = JSON.parse(match[1]);
                if (parsed.error && parsed.error.message) {
                    errorMsg = parsed.error.message;
                }
            }
        } catch (e) {}

        return res.status(500).json({ error: `AI is currently overloaded: ${errorMsg}. Please try again in a few moments.` });
    }
};

module.exports.config = {
    api: { bodyParser: false }
};
