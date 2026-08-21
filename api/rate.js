module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { sessionId, stars } = req.body || {};
    if (!sessionId || !stars || stars < 1 || stars > 5) {
        return res.status(400).json({ error: 'Invalid rating.' });
    }

    try {
        const db = require('./utils/supabase').checkSupabase();

        // Upsert — one rating per session
        const { error } = await db.from('ratings').upsert(
            [{ session_id: sessionId, stars: parseInt(stars, 10) }],
            { onConflict: 'session_id' }
        );

        if (error) throw error;

        return res.json({ success: true });
    } catch (err) {
        console.error('Rate error:', err);
        return res.status(500).json({ error: 'Failed to save rating.' });
    }
};
