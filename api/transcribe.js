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

const SYSTEM_PROMPT = `You are a precise document transcription assistant. Transcribe handwritten text from images with maximum accuracy.
- Transcribe ALL text exactly as written, preserving capitalization, punctuation, and paragraph structure
- Mark unclear words with [?] immediately after them
- Preserve paragraph breaks with a blank line
- Output ONLY the transcribed text, no preamble, no commentary
- For multiple images, treat them as sequential pages separated by: --- Page X ---`;

function sanitize(str) {
    return (str || '').replace(/[^\x20-\x7E]/g, '').trim();
}

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    // ---- Auth ----
    const appPassword = sanitize(process.env.APP_PASSWORD);
    if (appPassword) {
        const authHeader = sanitize(req.headers['authorization']);
        if (authHeader !== `Bearer ${appPassword}`) {
            return res.status(401).json({ error: 'Unauthorized: Invalid or missing password' });
        }
    }

    // ---- Parse multipart ----
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
        console.log('Trying Gemini...');
        const gemini = new GoogleGenAI({ apiKey: geminiKey });
        const parts = [
            ...imageBlocks.map(b => ({ inlineData: { mimeType: b.source.media_type, data: b.source.data } })),
            { text: userText }
        ];
        const response = await gemini.models.generateContent({
            model: 'gemini-3.6-flash',
            contents: [{ role: 'user', parts }],
            config: { systemInstruction: SYSTEM_PROMPT }
        });
        console.log('Gemini succeeded.');
        return res.json({ success: true, text: response.text });
    } catch (err) {
        console.error('Gemini failed:', err.message);
        return res.status(500).json({ error: `Both AI providers failed. Details: ${err.message}` });
    }
};

module.exports.config = {
    api: { bodyParser: false }
};
