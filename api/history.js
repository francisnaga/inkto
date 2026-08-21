module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    // Email comes from the URL query param set by verify.js after magic link validation
    const email = req.query.email ? req.query.email.toLowerCase().trim() : null;

    if (!email) {
        return res.status(401).json({ error: 'Unauthorized', requireAuth: true });
    }

    // Basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'Invalid email.' });
    }

    try {
        const db = require('./utils/supabase').checkSupabase();

        const { data, error } = await db
            .from('documents')
            .select('id, transcript_text, source_image_count, created_at, expires_at')
            .eq('email', email)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Only return documents that haven't expired
        const validDocs = (data || []).filter(doc => new Date(doc.expires_at) > new Date());

        const history = validDocs.map(doc => {
            const lines = (doc.transcript_text || '').split('\n').filter(Boolean);
            const preview = lines.length > 0 ? lines[0].substring(0, 80) : 'No text';
            return {
                id: doc.id,
                preview: preview + (lines[0] && lines[0].length > 80 ? '...' : ''),
                createdAt: doc.created_at,
                sourceImageCount: doc.source_image_count
            };
        });

        return res.json({ success: true, email, history });
    } catch (err) {
        console.error('History fetch error:', err);
        return res.status(500).json({ error: 'Failed to fetch history.' });
    }
};
