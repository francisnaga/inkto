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
    if (!/^\d{6,8}$/.test(otpStr)) {
        return res.status(400).json({ error: 'Verification code must be 6 to 8 digits.' });
    }

    try {
        const db = checkSupabase();

        // 1. Try default email OTP
        let result = await db.auth.verifyOtp({
            email: email.toLowerCase(),
            token: otpStr,
            type: 'email'
        });

        // 2. Fallback to signup type if token was issued for new user registration
        if (result.error) {
            const signupAttempt = await db.auth.verifyOtp({
                email: email.toLowerCase(),
                token: otpStr,
                type: 'signup'
            });
            if (!signupAttempt.error && signupAttempt.data?.session) {
                result = signupAttempt;
            }
        }

        // 3. Fallback to magiclink type
        if (result.error) {
            const magiclinkAttempt = await db.auth.verifyOtp({
                email: email.toLowerCase(),
                token: otpStr,
                type: 'magiclink'
            });
            if (!magiclinkAttempt.error && magiclinkAttempt.data?.session) {
                result = magiclinkAttempt;
            }
        }

        if (result.error) {
            console.error('Supabase verifyOtp error:', result.error.message);
            return res.status(result.error.status || 400).json({ error: result.error.message });
        }

        const data = result.data;
        if (!data || !data.session) {
            return res.status(400).json({ error: 'Verification failed. No session returned.' });
        }

        // Ensure row exists in public.users
        try {
            await db.from('users').upsert({ email: data.user.email.toLowerCase() }, { onConflict: 'email' });
        } catch (e) {
            console.warn('Upsert user notice:', e.message);
        }

        return res.json({
            success: true,
            email: data.user.email,
            sessionToken: data.session.access_token,
            refreshToken: data.session.refresh_token
        });
    } catch (err) {
        console.error('Verification handler error:', err);
        return res.status(500).json({ error: 'Verification failed. Please try again.' });
    }
};
