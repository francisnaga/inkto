const { Redis } = require('@upstash/redis');

// ---- Redis Setup ----
const redis = process.env.UPSTASH_REDIS_REST_KV_REST_API_URL 
    ? new Redis({ url: process.env.UPSTASH_REDIS_REST_KV_REST_API_URL, token: process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN })
    : null;

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    if (!redis) {
        return res.status(500).json({ error: 'Session storage is not configured.' });
    }

    const { id } = req.query;
    if (!id) {
        return res.status(400).json({ error: 'Session ID is required.' });
    }

    try {
        const session = await redis.get(`session:${id}`);
        if (!session) {
            return res.status(404).json({ error: 'Session not found or has expired.' });
        }
        
        return res.json({ success: true, session });
    } catch (err) {
        console.error('Failed to fetch session:', err);
        return res.status(500).json({ error: 'Failed to retrieve session.' });
    }
};
