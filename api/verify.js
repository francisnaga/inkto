const { serialize } = require('cookie');
const crypto = require('crypto');
const { supabase } = require('./utils/supabase');

const COOKIE_SECRET = process.env.COOKIE_SECRET || process.env.SUPABASE_ANON_KEY || 'default-secret';

function signCookie(email) {
    const expires = Date.now() + 30 * 24 * 60 * 60 * 1000;
    const data = `${email}:${expires}`;
    const hmac = crypto.createHmac('sha256', COOKIE_SECRET).update(data).digest('hex');
    return `${data}:${hmac}`;
}

module.exports = async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).send('Method not allowed');

    const { token } = req.query;
    if (!token) {
        return res.status(400).send(`<!DOCTYPE html><html><head><meta http-equiv="refresh" content="3;url=/history" /></head><body style="font-family:sans-serif;padding:40px;text-align:center;"><p>Invalid token. <a href="/history">Go back</a></p></body></html>`);
    }

    try {
        const { data: tokenData, error } = await supabase
            .from('auth_tokens')
            .select('email, expires_at, used')
            .eq('token', token)
            .single();

        if (error || !tokenData) {
            return res.status(400).send(`<!DOCTYPE html><html><head><meta http-equiv="refresh" content="3;url=/history" /></head><body style="font-family:sans-serif;padding:40px;text-align:center;"><p>This link is invalid or expired. <a href="/history">Request a new one</a></p></body></html>`);
        }

        if (tokenData.used) {
            return res.status(400).send(`<!DOCTYPE html><html><head><meta http-equiv="refresh" content="3;url=/history" /></head><body style="font-family:sans-serif;padding:40px;text-align:center;"><p>This link has already been used. <a href="/history">Request a new one</a></p></body></html>`);
        }

        if (new Date(tokenData.expires_at) < new Date()) {
            return res.status(400).send(`<!DOCTYPE html><html><head><meta http-equiv="refresh" content="3;url=/history" /></head><body style="font-family:sans-serif;padding:40px;text-align:center;"><p>This link has expired. <a href="/history">Request a new one</a></p></body></html>`);
        }

        // Mark token as used
        await supabase.from('auth_tokens').update({ used: true }).eq('token', token);

        // Set signed cookie
        const cookieValue = signCookie(tokenData.email);
        const cookieHeader = serialize('inkto_auth', cookieValue, {
            httpOnly: true,
            secure: true,
            maxAge: 30 * 24 * 60 * 60,
            path: '/',
            sameSite: 'lax'
        });

        // Use a meta-redirect HTML page so the cookie is reliably set
        // before the React app boots (avoids race conditions with 302 redirect)
        res.setHeader('Set-Cookie', cookieHeader);
        res.setHeader('Content-Type', 'text/html');
        return res.status(200).send(`<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Signing in to Inkto...</title>
    <meta http-equiv="refresh" content="0;url=/history" />
    <style>
        body { font-family: -apple-system, sans-serif; background: #F5F4F0; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
        .box { text-align: center; }
        .dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #1C1917; margin: 0 3px; animation: bounce 1s ease-in-out infinite; }
        .dot:nth-child(2) { animation-delay: 0.15s; }
        .dot:nth-child(3) { animation-delay: 0.3s; }
        @keyframes bounce { 0%,100%{transform:translateY(0);opacity:.4;} 50%{transform:translateY(-8px);opacity:1;} }
        p { color: #78716C; font-size: 14px; margin-top: 16px; }
    </style>
</head>
<body>
    <div class="box">
        <div><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>
        <p>Signing you in...</p>
    </div>
    <script>window.location.href = '/history';</script>
</body>
</html>`);
    } catch (err) {
        console.error('Verify error:', err);
        return res.status(500).send(`<!DOCTYPE html><html><head><meta http-equiv="refresh" content="3;url=/history" /></head><body style="font-family:sans-serif;padding:40px;text-align:center;"><p>Something went wrong. <a href="/history">Try again</a></p></body></html>`);
    }
};
