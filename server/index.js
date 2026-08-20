import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

import transcribeRoute from './routes/transcribe.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS - allow all origins (same-domain on Vercel, localhost in dev)
app.use(cors());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);

// Middleware
app.use(express.json());

// API Routes
app.use('/api/transcribe', transcribeRoute);

// Only listen if not running in Vercel serverless environment
if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

export default app;
