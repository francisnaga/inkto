const { supabase } = require('./utils/supabase');

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { email, sessionId } = req.body || {};
    if (!email || !sessionId) {
        return res.status(400).json({ error: 'Email and Session ID are required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email address.' });
    }

    try {
        const db = require('./utils/supabase').checkSupabase();

        // Update the document to tie it to the user's email
        const { error } = await db
            .from('documents')
            .update({ email: email.toLowerCase() })
            .eq('id', sessionId);

        if (error) throw error;

        return res.json({ success: true });
    } catch (err) {
        console.error('Failed to save to history:', err);
        return res.status(500).json({ error: 'Failed to save to history.' });
    }
};
