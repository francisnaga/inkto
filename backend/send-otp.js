const { checkSupabase } = require('./_utils/supabase');

module.exports = async function handler(req, res) {
    const origin = req.headers.origin || '*';
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cookie, Authorization, X-Inkto-Auth');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: 'Email is required.' });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return res.status(400).json({ error: 'Invalid email address.' });

    try {
        const db = checkSupabase();

        // Call Supabase built-in OTP
        const { error } = await db.auth.signInWithOtp({
            email: email.toLowerCase(),
            options: {
                shouldCreateUser: true
            }
        });

        if (error) {
            console.error('Supabase signInWithOtp error:', error.message);
            return res.status(error.status || 400).json({ error: error.message });
        }

        return res.json({ success: true });
    } catch (err) {
        console.error('Send OTP error:', err);
        return res.status(500).json({ error: 'Failed to send code. Please try again.' });
    }
};
