const { supabase } = require('./_utils/supabase');

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { email, sessionId } = req.body || {};
    const authEmail = await require('./_utils/auth').getAuthEmail(req);
    const targetEmail = authEmail || (email ? email.toLowerCase() : null);
    if (!targetEmail || !sessionId) {
        return res.status(400).json({ error: 'Email and Session ID are required.' });
    }

    try {
        const db = require('./_utils/supabase').checkSupabase();

        // Update the document to tie it to the user's email and extend expiration
        const { error } = await db
            .from('documents')
            .update({ 
                email: targetEmail.toLowerCase(),
                expires_at: new Date('2099-12-31T23:59:59.999Z').toISOString()
            })
            .eq('id', sessionId);

        if (error) throw error;

        return res.json({ success: true });
    } catch (err) {
        console.error('Failed to save to history:', err);
        return res.status(500).json({ error: 'Failed to save to history.' });
    }
};
