const { kv } = require('@vercel/kv');

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    if (!process.env.KV_REST_API_URL) {
        return res.status(500).json({ error: 'Session storage is not configured.' });
    }

    const { id } = req.query;
    if (!id) {
        return res.status(400).json({ error: 'Session ID is required.' });
    }

    try {
        const session = await kv.get(`session:${id}`);
        if (!session) {
            return res.status(404).json({ error: 'Session not found or has expired.' });
        }
        
        return res.json({ success: true, session });
    } catch (err) {
        console.error('Failed to fetch session:', err);
        return res.status(500).json({ error: 'Failed to retrieve session.' });
    }
};
