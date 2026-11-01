const { checkSupabase } = require('./_utils/supabase');

module.exports = async function handler(req, res) {
    const origin = req.headers.origin || '*';
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cookie, Authorization, X-Inkto-Auth');

    if (req.method === 'OPTIONS') return res.status(200).end();

    // GET: Magic-link verification
    if (req.method === 'GET') {
        const { token } = req.query;
        if (!token) {
            return res.redirect('/history');
        }

        try {
            const db = checkSupabase();

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

            // Mark token as used
            await db.from('auth_tokens').update({ used: true }).eq('token', token);

            const email = encodeURIComponent(tokenData.email);

            res.setHeader('Content-Type', 'text/html');
            return res.status(200).send(`<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Signing in to Inkto...</title>
    <meta http-equiv="refresh" content="0;url=/history?email=${email}" />
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
    <script>window.location.href = '/history?email=' + encodeURIComponent('${tokenData.email}');</script>
</body>
</html>`);
        } catch (err) {
            console.error('Verify error:', err);
            return res.status(500).send(errorPage('Something went wrong. Please try again.'));
        }
    }

    // POST: OTP code verification (Supabase Auth)
    if (req.method === 'POST') {
        const { email, otp } = req.body || {};
        if (!email || !otp) return res.status(400).json({ error: 'Email and code are required.' });

        const otpStr = String(otp).trim().replace(/\s/g, '');
        if (!/^\d{6,8}$/.test(otpStr)) {
            return res.status(400).json({ error: 'Verification code must be 6 to 8 digits.' });
        }

        try {
            const db = checkSupabase();

            let result = await db.auth.verifyOtp({
                email: email.toLowerCase(),
                token: otpStr,
                type: 'email'
            });

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
    }

    return res.status(405).json({ error: 'Method not allowed' });
};

function errorPage(message) {
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Inkto</title></head>
<body style="font-family:-apple-system,sans-serif;padding:40px;text-align:center;background:#F5F4F0;">
<p style="color:#57534E;font-size:16px;">${message}</p>
<a href="/history" style="color:#2563EB;font-size:14px;">Request a new link</a>
</body></html>`;
}
