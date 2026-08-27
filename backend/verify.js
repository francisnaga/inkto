const { checkSupabase } = require('./_utils/supabase');

module.exports = async function handler(req, res) {
    const origin = req.headers.origin || '*';
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cookie, Authorization, X-Inkto-Auth');

    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email, otp } = req.body || {};
    if (!email || !otp) return res.status(400).json({ error: 'Email and code are required.' });

    const otpStr = String(otp).trim().replace(/\s/g, '');
    if (!/^\d{6}$/.test(otpStr)) return res.status(400).json({ error: 'Code must be 6 digits.' });

    try {
        const db = checkSupabase();

        // Verify OTP using Supabase Auth
        const { data, error } = await db.auth.verifyOtp({
            email: email.toLowerCase(),
            token: otpStr,
            type: 'email'
        });

        if (error) {
            console.error('Supabase verifyOtp error:', error.message);
            return res.status(error.status || 400).json({ error: error.message });
        }

        if (!data.session) {
            return res.status(400).json({ error: 'Verification failed. No session returned.' });
        }

        return res.json({
            success: true,
            email: data.user.email,
            sessionToken: data.session.access_token,
            refreshToken: data.session.refresh_token
        });
    } catch (err) {
        console.error('OTP verify error:', err);
        return res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
};
