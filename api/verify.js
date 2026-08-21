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
    // 30-day cookie — frictionless repeat access
    const expires = Date.now() + 30 * 24 * 60 * 60 * 1000;
    const data = `${email}:${expires}`;
    const hmac = crypto.createHmac('sha256', COOKIE_SECRET).update(data).digest('hex');
    return `${data}:${hmac}`;
}

module.exports = async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).send('Method not allowed');

    const { token } = req.query;
    if (!token) return res.redirect('/history');

    try {
        const db = require('./utils/supabase').checkSupabase();

        const { data: tokenData, error } = await db
            .from('auth_tokens')
            .select('email, used, expires_at')
            .eq('token', token)
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

        // Mark token as used — one-time-use, 15-min window (the security guarantee)
        await db.from('auth_tokens').update({ used: true }).eq('token', token);

        // Set a 30-day signed cookie — this is what grants frictionless repeat access
        // (the magic link only needs to be trustworthy for the one moment it's clicked)
        const cookieValue = signCookie(tokenData.email);
        res.setHeader('Set-Cookie', serializeCookie('inkto_auth', cookieValue, {
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60, // 30 days
            path: '/'
        }));

        res.setHeader('Content-Type', 'text/html');
        return res.status(200).send(`<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Opening Inkto...</title>
    <meta http-equiv="refresh" content="0;url=/history" />
    <style>
        body { font-family: -apple-system, sans-serif; background: #0F172A; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
        .box { text-align: center; }
        .dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #fff; margin: 0 3px; animation: bounce 1s ease-in-out infinite; }
        .dot:nth-child(2) { animation-delay: 0.15s; }
        .dot:nth-child(3) { animation-delay: 0.3s; }
        @keyframes bounce { 0%,100%{transform:translateY(0);opacity:.3;} 50%{transform:translateY(-8px);opacity:1;} }
        p { color: rgba(255,255,255,0.5); font-size: 14px; margin-top: 16px; }
    </style>
</head>
<body>
    <div class="box">
        <div><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>
        <p>Opening your history...</p>
    </div>
    <script>window.location.href = '/history';</script>
</body>
</html>`);
    } catch (err) {
        console.error('Verify error:', err);
        return res.status(500).send(errorPage('Something went wrong. Please try again.'));
    }
};

function errorPage(message) {
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Inkto</title></head>
<body style="font-family:-apple-system,sans-serif;padding:40px;text-align:center;background:#F5F4F0;">
<p style="color:#57534E;font-size:16px;">${message}</p>
<a href="/history" style="color:#2563EB;font-size:14px;">Request a new link</a>
</body></html>`;
}
