// Try every plausible model name with this key
const { GoogleGenAI } = require('@google/genai');

const geminiKey = 'AQ.Ab8RN6KpTZepaLnybfbB7Thyq9fQO1eRPBaKm1mrWxJtUCKhMA';
const gemini = new GoogleGenAI({ apiKey: geminiKey });

const PNG = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI6QAAAABJRU5ErkJggg==',
    'base64'
).toString('base64');

const candidates = [
    'gemini-3.6-flash',
    'gemini-3.5-flash',
    'gemini-3.0-flash',
    'gemini-3.0-flash-lite',
    'gemini-3.6-flash-lite',
    'gemini-3.5-flash-lite',
    'gemini-flash-3.6',
    'gemini-3.6-pro',
    'gemini-exp-1206',
    'gemini-exp-1121',
];

async function testAll() {
    for (const model of candidates) {
        try {
            const r = await gemini.models.generateContent({
                model,
                contents: [{ role: 'user', parts: [{ text: 'Hi' }] }]
            });
            console.log(`✓ ${model}: ${r.text.substring(0, 30)}`);
        } catch (e) {
            const msg = e.message.substring(0, 80);
            console.log(`✗ ${model}: ${msg}`);
        }
    }
}

testAll();
