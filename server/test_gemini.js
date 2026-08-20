// Full test with a real image against the local server
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';

// Create a minimal 1x1 valid PNG
const PNG_1X1 = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI6QAAAABJRU5ErkJggg==',
    'base64'
);

async function test() {
    const geminiKey = 'AQ.Ab8RN6KpTZepaLnybfbB7Thyq9fQO1eRPBaKm1mrWxJtUCKhMA';
    const gemini = new GoogleGenAI({ apiKey: geminiKey });

    const imageBase64 = PNG_1X1.toString('base64');
    
    try {
        const response = await gemini.models.generateContent({
            model: 'gemini-3.6-flash',
            contents: [{
                role: 'user',
                parts: [
                    { inlineData: { mimeType: 'image/png', data: imageBase64 } },
                    { text: 'Transcribe any handwritten text in this image. If blank just say BLANK.' }
                ]
            }]
        });
        console.log('Image transcription SUCCESS:', response.text);
    } catch (err) {
        console.error('Image transcription FAILED:', err.message);
    }
}

test();
