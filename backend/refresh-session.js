const { checkSupabase } = require('./_utils/supabase');

module.exports = async function handler(req, res) {
    const origin = req.headers.origin || '*';
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cookie, Authorization, X-Inkto-Auth, Cache-Control');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { refreshToken } = req.body || {};
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token is required.' });

    try {
        const db = checkSupabase();
        const { data, error } = await db.auth.refreshSession({ refresh_token: refreshToken });

        if (error) {
            console.error('Supabase refreshSession error:', error.message);
            return res.status(error.status || 400).json({ error: error.message });
        }

        return res.json({
            success: true,
            email: data.user.email,
            sessionToken: data.session.access_token,
            refreshToken: data.session.refresh_token
        });
    } catch (err) {
        console.error('Refresh session error:', err);
        return res.status(500).json({ error: 'Failed to refresh session.' });
    }
};
