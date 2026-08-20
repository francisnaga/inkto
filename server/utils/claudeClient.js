import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenAI } from '@google/genai';

const SYSTEM_PROMPT = `You are a precise document transcription assistant. Your job is to transcribe handwritten text from document images with maximum accuracy.

Rules:
- Transcribe ALL text exactly as written, preserving original capitalization, punctuation, and paragraph structure
- If a word is unclear, transcribe your best guess and mark it with [?] immediately after: example word[?]
- Preserve paragraph breaks — use a blank line between paragraphs
- Do NOT add headers, commentary, or notes about the document
- Do NOT say "Here is the transcription" or any preamble
- Output ONLY the transcribed text, nothing else
- If multiple images are provided, treat them as sequential pages of one document and transcribe them in order, separating pages with: --- Page X ---`;

export const callClaudeVision = async (imageBlocks, customPrompt = '') => {

    const userTextPrompt = customPrompt
        ? `Transcribe all pages of this handwritten document. Additional instructions: ${customPrompt}`
        : "Transcribe all pages of this handwritten document.";

    // ---- Try Anthropic Claude first ----
    const anthropicKey = (process.env.ANTHROPIC_API_KEY || '').trim();
    if (anthropicKey) {
        try {
            console.log("Attempting transcription with Anthropic Claude...");
            const anthropic = new Anthropic({ apiKey: anthropicKey });

            const response = await anthropic.messages.create({
                model: "claude-3-5-sonnet-20241022",
                max_tokens: 4096,
                system: SYSTEM_PROMPT,
                messages: [
                    {
                        role: "user",
                        content: [
                            ...imageBlocks,
                            { type: "text", text: userTextPrompt }
                        ]
                    }
                ]
            });

            console.log("Anthropic succeeded.");
            return response.content[0].text;
        } catch (err) {
            console.error("Anthropic failed, trying Gemini fallback. Error:", err.message);
        }
    } else {
        console.log("No Anthropic key, skipping to Gemini...");
    }

    // ---- Fallback: Gemini ----
    const geminiKey = (process.env.GEMINI_API_KEY || '').trim();
    if (!geminiKey) {
        throw new Error("No API keys configured. Please set ANTHROPIC_API_KEY or GEMINI_API_KEY in Vercel environment variables.");
    }

    try {
        console.log("Attempting transcription with Gemini 2.5 Flash...");
        const gemini = new GoogleGenAI({ apiKey: geminiKey });

        const geminiParts = imageBlocks.map(block => ({
            inlineData: {
                mimeType: block.source.media_type,
                data: block.source.data
            }
        }));
        geminiParts.push({ text: userTextPrompt });

        const response = await gemini.models.generateContent({
            model: 'gemini-3.6-flash',
            contents: [{ role: 'user', parts: geminiParts }],
            config: { systemInstruction: SYSTEM_PROMPT }
        });

        console.log("Gemini succeeded.");
        return response.text;
    } catch (err) {
        console.error("Gemini also failed:", err.message);
        throw new Error("Both AI providers failed. Please check your API keys on Vercel and try again.");
    }
};
