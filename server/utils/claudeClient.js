import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenAI } from '@google/genai';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || 'dummy_key',
});

// Initialize Gemini if key exists
let gemini = null;
if (process.env.GEMINI_API_KEY) {
    gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

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
    
    // We add the user text to instruct transcription
    const userTextPrompt = customPrompt 
        ? `Transcribe all pages of this handwritten document. Additional instructions: ${customPrompt}` 
        : "Transcribe all pages of this handwritten document.";

    const messages = [
        {
            role: "user",
            content: [
                ...imageBlocks,
                {
                    type: "text",
                    text: userTextPrompt
                }
            ]
        }
    ];

    try {
        console.log("Attempting transcription with Anthropic Claude...");
        if (!process.env.ANTHROPIC_API_KEY) throw new Error("Anthropic key missing");

        const response = await anthropic.messages.create({
            model: "claude-3-5-sonnet-20240620", // using claude-3-5-sonnet
            max_tokens: 4096,
            system: SYSTEM_PROMPT,
            messages: messages
        });

        return response.content[0].text;
    } catch (error) {
        console.log("Anthropic failed or key missing, falling back to Gemini:", error.message);
        
        if (!gemini) {
            throw new Error("Both Anthropic and Gemini failed or keys are missing.");
        }

        // Convert Claude image blocks to Gemini parts
        const geminiParts = imageBlocks.map(block => {
            return {
                inlineData: {
                    mimeType: block.source.media_type,
                    data: block.source.data
                }
            };
        });
        
        // Add text prompt
        geminiParts.push({ text: userTextPrompt });

        console.log("Attempting transcription with Gemini 2.5 Flash...");
        const response = await gemini.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: geminiParts,
            config: {
                systemInstruction: SYSTEM_PROMPT
            }
        });

        return response.text;
    }
};
