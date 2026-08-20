import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenAI } from '@google/genai';
import multer from 'multer';

// ---- Multer for memory storage (no disk) ----
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 25 * 1024 * 1024 }, // 25MB per file
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/gif'];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(null, false); // silently skip unsupported types
        }
    }
});

// ---- Promisify multer for use in serverless ----
function runMiddleware(req, res, fn) {
    return new Promise((resolve, reject) => {
        fn(req, res, (result) => {
            if (result instanceof Error) reject(result);
            else resolve(result);
        });
    });
}

// ---- AI System Prompt ----
const SYSTEM_PROMPT = `You are a precise document transcription assistant. Your job is to transcribe handwritten text from document images with maximum accuracy.

Rules:
- Transcribe ALL text exactly as written, preserving original capitalization, punctuation, and paragraph structure
- If a word is unclear, mark it with [?] immediately after it
- Preserve paragraph breaks using a blank line between paragraphs
- Do NOT add headers, commentary, or notes about the document
- Do NOT say "Here is the transcription" or any preamble
- Output ONLY the transcribed text, nothing else
- If multiple images are provided, treat them as sequential pages and transcribe in order, separating pages with: --- Page X ---`;

// ---- Main Handler ----
export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // ---- Auth Check ----
    const appPassword = (process.env.APP_PASSWORD || '').replace(/[^\x20-\x7E]/g, '').trim();
    if (appPassword) {
        const authHeader = (req.headers['authorization'] || '').replace(/[^\x20-\x7E]/g, '').trim();
        if (authHeader !== `Bearer ${appPassword}`) {
            return res.status(401).json({ error: 'Unauthorized: Invalid or missing password' });
        }
    }

    // ---- Parse files with multer ----
    try {
        await runMiddleware(req, res, upload.array('files', 30));
    } catch (err) {
        return res.status(400).json({ error: `File upload error: ${err.message}` });
    }

    const files = req.files;
    if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No image files received. Please upload JPG, PNG, or WEBP images.' });
    }

    // ---- Build image blocks ----
    const imageBlocks = files.map(file => {
        let mediaType = file.mimetype;
        if (mediaType === 'image/jpg') mediaType = 'image/jpeg';
        return {
            type: 'image',
            source: {
                type: 'base64',
                media_type: mediaType,
                data: file.buffer.toString('base64')
            }
        };
    });

    const customPrompt = req.body?.prompt || '';
    const userText = customPrompt
        ? `Transcribe all pages. Additional instructions: ${customPrompt}`
        : 'Transcribe all pages of this handwritten document.';

    // ---- Try Anthropic ----
    const anthropicKey = (process.env.ANTHROPIC_API_KEY || '').replace(/[^\x20-\x7E]/g, '').trim();
    if (anthropicKey) {
        try {
            console.log(`Trying Anthropic with ${imageBlocks.length} image(s)...`);
            const anthropic = new Anthropic({ apiKey: anthropicKey });
            const response = await anthropic.messages.create({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 8192,
                system: SYSTEM_PROMPT,
                messages: [{
                    role: 'user',
                    content: [...imageBlocks, { type: 'text', text: userText }]
                }]
            });
            console.log('Anthropic succeeded.');
            return res.json({ success: true, text: response.content[0].text });
        } catch (err) {
            console.error('Anthropic failed:', err.message);
        }
    }

    // ---- Fallback: Gemini ----
    const geminiKey = (process.env.GEMINI_API_KEY || '').replace(/[^\x20-\x7E]/g, '').trim();
    if (!geminiKey) {
        return res.status(500).json({ error: 'No API keys configured. Please add ANTHROPIC_API_KEY or GEMINI_API_KEY to Vercel environment variables.' });
    }

    try {
        console.log(`Trying Gemini with ${imageBlocks.length} image(s)...`);
        const gemini = new GoogleGenAI({ apiKey: geminiKey });

        const geminiParts = imageBlocks.map(b => ({
            inlineData: { mimeType: b.source.media_type, data: b.source.data }
        }));
        geminiParts.push({ text: userText });

        const response = await gemini.models.generateContent({
            model: 'gemini-3.6-flash',
            contents: [{ role: 'user', parts: geminiParts }],
            config: { systemInstruction: SYSTEM_PROMPT }
        });
        console.log('Gemini succeeded.');
        return res.json({ success: true, text: response.text });
    } catch (err) {
        console.error('Gemini failed:', err.message);
        // Return full error so we can debug from the phone
        return res.status(500).json({ 
            error: `AI Error: ${err.message}`,
            hint: 'Check ANTHROPIC_API_KEY and GEMINI_API_KEY in Vercel environment variables'
        });
    }
}

export const config = {
    api: {
        bodyParser: false, // Required for multer to handle multipart/form-data
    },
};
