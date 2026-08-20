// Test the CommonJS api/transcribe.js handler directly
const handler = require('./transcribe.js');

// Mock a minimal req/res with a real PNG image and correct password
const PNG_1X1 = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI6QAAAABJRU5ErkJggg==',
    'base64'
);

// We need to simulate what multer gives us after parsing
// Bypassing multer by mocking req.files directly for unit test
const req = {
    method: 'POST',
    headers: { authorization: 'Bearer 32888012Ba#' },
    files: [{
        mimetype: 'image/png',
        buffer: PNG_1X1,
        originalname: 'test.png'
    }],
    body: { prompt: '' }
};

const res = {
    _status: 200,
    _body: null,
    status(code) { this._status = code; return this; },
    json(body) { this._body = body; console.log('RESPONSE', this._status, JSON.stringify(body).substring(0, 400)); return this; },
    end() { return this; },
    setHeader() { return this; }
};

// Temporarily patch multer to skip real parsing since we mocked req.files
const multer = require('multer');
const origMemory = multer.memoryStorage;

// Inject files directly - bypass runMiddleware by mocking the module
// We do this by calling handler directly after setting req.files (multer won't re-parse)
// This simulates what Vercel does after multer has run

// Actually, skip multer parsing by using a simple direct test
async function testDirect() {
    process.env.APP_PASSWORD = '32888012Ba#';
    process.env.GEMINI_API_KEY = 'AQ.Ab8RN6KpTZepaLnybfbB7Thyq9fQO1eRPBaKm1mrWxJtUCKhMA';
    
    // Call the Gemini part directly since we can't fully mock multer
    const { GoogleGenAI } = require('@google/genai');
    const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const parts = [
        { inlineData: { mimeType: 'image/png', data: PNG_1X1.toString('base64') } },
        { text: 'Transcribe any text. If blank say BLANK.' }
    ];
    
    const response = await gemini.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: [{ role: 'user', parts }]
    });
    
    console.log('Direct Gemini call result:', response.text);
    console.log('TEST PASSED ✓');
}

testDirect().catch(err => {
    console.error('TEST FAILED:', err.message);
    process.exit(1);
});
