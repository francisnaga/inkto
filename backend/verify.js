const crypto = require('crypto');

const serializeCookie = (name, val, options = {}) => {
    let str = `${name}=${encodeURIComponent(val)}`;
    if (options.maxAge) str += `; Max-Age=${Math.floor(options.maxAge)}`;
    if (options.domain) str += `; Domain=${options.domain}`;
    if (options.path) str += `; Path=${options.path}`;
    if (options.expires) str += `; Expires=${options.expires.toUTCString()}`;
    if (options.httpOnly) str += `; HttpOnly`;
    if (options.secure) str += `; Secure`;
    if (options.sameSite) str += `; SameSite=${options.sameSite}`;
    return str;
};

const COOKIE_SECRET = process.env.COOKIE_SECRET || process.env.SUPABASE_ANON_KEY || 'inkto-default-secret';

function signCookie(email) {
    const expires = Date.now() + 60 * 24 * 60 * 60 * 1000; // 60-day session per spec
    const data = `${email}:${expires}`;
    const hmac = crypto.createHmac('sha256', COOKIE_SECRET).update(data).digest('hex');
    return `${data}:${hmac}`;
}

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    // ── POST: Verify a 6-digit OTP (in-app, stays in the app) ──
    if (req.method === 'POST') {
        const { email, otp } = req.body || {};
        if (!email || !otp) return res.status(400).json({ error: 'Email and code are required.' });

        const otpStr = String(otp).trim().replace(/\s/g, '');
        if (!/^\d{6}$/.test(otpStr)) return res.status(400).json({ error: 'Code must be 6 digits.' });

        try {
            const db = require('./_utils/supabase').checkSupabase();

            // Hash the submitted OTP the same way we hashed it on creation
            const otpHash = crypto.createHmac('sha256', COOKIE_SECRET)
                .update(otpStr)
                .digest('hex');

            const { data: tokenData, error } = await db
                .from('auth_tokens')
                .select('email, used, expires_at, type')
                .eq('token', otpHash)
                .eq('email', email.toLowerCase())
                .eq('type', 'otp')
                .single();

            if (error || !tokenData) {
                return res.status(400).json({ error: 'Invalid code. Please check and try again.' });
            }
            if (tokenData.used) {
                return res.status(400).json({ error: 'This code has already been used. Request a new one.' });
            }
            if (new Date(tokenData.expires_at) < new Date()) {
                return res.status(400).json({ error: 'This code has expired. Request a new one.' });
            }

            // Mark used — one-time only
            await db.from('auth_tokens').update({ used: true }).eq('token', otpHash);

            // Issue 60-day session cookie per spec
            const cookieValue = signCookie(tokenData.email);
            const host = req.headers.host || '';
            const isSecure = !host.includes('localhost') && !host.includes('127.0.0.1') && !host.includes('192.168.');
            res.setHeader('Set-Cookie', serializeCookie('inkto_auth', cookieValue, {
                httpOnly: true,
                secure: isSecure,
                sameSite: 'lax',
                maxAge: 60 * 24 * 60 * 60,
                path: '/'
            }));

            return res.json({ success: true, email: tokenData.email });
        } catch (err) {
            console.error('OTP verify error:', err);
            return res.status(500).json({ error: 'Something went wrong. Please try again.' });
        }
    }

    // ── GET: Magic-link verification (legacy path — keep working) ──
    if (req.method === 'GET') {
        const { token } = req.query;
        if (!token) return res.redirect('/');

        try {
            const db = require('./_utils/supabase').checkSupabase();

            const { data: tokenData, error } = await db
                .from('auth_tokens')
                .select('email, used, expires_at')
                .eq('token', token)
                .is('type', null) // magic-link tokens have no type field
                .single();

            if (error || !tokenData) {
                return res.status(400).send(errorPage('This link is invalid or has already been used.'));
            }
            if (tokenData.used) {
                return res.status(400).send(errorPage('This link has already been used. Please request a new one.'));
            }
            if (new Date(tokenData.expires_at) < new Date()) {
                return res.status(400).send(errorPage('This link has expired. Please request a new one.'));
            }

            await db.from('auth_tokens').update({ used: true }).eq('token', token);

            const cookieValue = signCookie(tokenData.email);
            const host = req.headers.host || '';
            const isSecure = !host.includes('localhost') && !host.includes('127.0.0.1') && !host.includes('192.168.');
            res.setHeader('Set-Cookie', serializeCookie('inkto_auth', cookieValue, {
                httpOnly: true,
                secure: isSecure,
                sameSite: 'lax',
                maxAge: 60 * 24 * 60 * 60,
                path: '/'
            }));

            return res.redirect('/');
        } catch (err) {
            console.error('Magic-link verify error:', err);
            return res.status(500).send(errorPage('Something went wrong. Please try again.'));
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
};

function errorPage(message) {
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Inkto</title></head>
<body style="font-family:-apple-system,sans-serif;padding:40px;text-align:center;background:#F5F4F0;">
<p style="color:#57534E;font-size:16px;">${message}</p>
<a href="/" style="color:#2563EB;font-size:14px;">Back to Inkto</a>
</body></html>`;
}
