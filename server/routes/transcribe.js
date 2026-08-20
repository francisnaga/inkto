import express from 'express';
import multer from 'multer';
import { callClaudeVision } from '../utils/claudeClient.js';
import { processFileToImageBlocks } from '../utils/imageHelper.js';

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 20 * 1024 * 1024, // 20MB per file
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`Unsupported file type: ${file.mimetype}`), false);
        }
    }
});

router.post('/', upload.array('files', 20), async (req, res) => {
    // Basic Authentication Check
    if (process.env.APP_PASSWORD) {
        const authHeader = req.headers.authorization;
        if (!authHeader || authHeader !== `Bearer ${process.env.APP_PASSWORD}`) {
            return res.status(401).json({ error: "Unauthorized: Invalid or missing password" });
        }
    }

    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: "No files received" });
        }

        const customPrompt = req.body.prompt || '';
        
        let allImageBlocks = [];
        
        for (const file of req.files) {
            try {
                const blocks = await processFileToImageBlocks(file);
                allImageBlocks = allImageBlocks.concat(blocks);
            } catch (err) {
                return res.status(500).json({ error: err.message || "Could not process file" });
            }
        }

        if (allImageBlocks.length === 0) {
            return res.status(400).json({ error: "No valid images could be extracted from files" });
        }

        const text = await callClaudeVision(allImageBlocks, customPrompt);

        return res.json({ success: true, text });
    } catch (error) {
        console.error("Transcription error:", error);
        return res.status(500).json({ error: error.message || "Server misconfigured or API error" });
    }
});

export default router;
