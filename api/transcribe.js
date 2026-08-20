const Anthropic = require('@anthropic-ai/sdk');
const { GoogleGenAI } = require('@google/genai');
const multer = require('multer');

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
5. MULTIPLE PAGES: Treat them as sequential pages of one document, separated by: --- Page X ---
6. NO CHATTER: Output ONLY the clean, final transcribed text. No preamble, no commentary, no markdown formatting (unless it was in the text).`;

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
        return res.status(400).json({ error: 'No valid files received. Please upload images or PDFs.' });
    }

    // ---- Build data blocks ----
    const dataBlocks = files.map(file => {
        let mediaType = file.mimetype === 'image/jpg' ? 'image/jpeg' : file.mimetype;
        return {
            type: mediaType === 'application/pdf' ? 'document' : 'image',
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
                temperature: 0.1,
                system: SYSTEM_PROMPT,
                messages: [{ role: 'user', content: [...dataBlocks, { type: 'text', text: userText }] }]
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
            ...dataBlocks.map(b => ({ inlineData: { mimeType: b.source.media_type, data: b.source.data } })),
            { text: userText }
        ];
        
        const modelChain = ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite'];
        let lastError = null;

        for (const model of modelChain) {
            try {
                console.log(`Trying ${model}...`);
                const response = await gemini.models.generateContent({
                    model,
                    contents: [{ role: 'user', parts }],
                    config: { 
                        systemInstruction: SYSTEM_PROMPT,
                        temperature: 0.1
                    }
                });
                console.log(`${model} succeeded.`);
                return res.json({ success: true, text: response.text });
            } catch (modelErr) {
                console.warn(`${model} failed:`, modelErr.message.substring(0, 120));
                lastError = modelErr;
            }
        }
        // All models in chain failed
        const failMsg = lastError ? lastError.message : 'Unknown error';
        let errorMsg = failMsg;
        try {
            const match = failMsg.match(/(\{.*\})/);
            if (match) {
                const parsed = JSON.parse(match[1]);
                if (parsed.error && parsed.error.message) errorMsg = parsed.error.message;
            }
        } catch (e) {}

        return res.status(500).json({ error: `AI overloaded. Please tap Try Again — it usually recovers quickly.` });

    } catch (err) {
        console.error('Gemini setup error:', err.message);
        return res.status(500).json({ error: `Server error: ${err.message}` });
    }
};

module.exports.config = {
    api: { bodyParser: false }
};
