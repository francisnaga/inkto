const { Resend } = require('resend');
const crypto = require('crypto');

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) return res.status(500).json({ error: 'Email service not configured.' });

    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: 'Email is required.' });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return res.status(400).json({ error: 'Invalid email address.' });

    try {
        const db = require('./_utils/supabase').checkSupabase();

        // Generate a cryptographically random 6-digit OTP
        const otp = String(crypto.randomInt(100000, 999999));

        // Hash the OTP before storing — plain-text OTPs in DB are a security risk
        const otpHash = crypto.createHmac('sha256', process.env.COOKIE_SECRET || 'inkto-secret')
            .update(otp)
            .digest('hex');

        // OTP expires in 10 minutes
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        // Invalidate any previous unused OTPs for this email
        await db.from('auth_tokens')
            .update({ used: true })
            .eq('email', email.toLowerCase())
            .eq('used', false);

        // Insert new OTP record — store the hash, never the plain OTP
        const { error: dbError } = await db.from('auth_tokens').insert([{
            token: otpHash,
            email: email.toLowerCase(),
            expires_at: expiresAt.toISOString(),
            used: false,
            type: 'otp'  // distinguish from magic-link tokens
        }]);

        if (dbError) throw dbError;

        const resend = new Resend(resendKey);

        const { error: emailError } = await resend.emails.send({
            from: 'Inkto <noreply@inkto.jointaccount.org>',
            to: email,
            subject: `${otp} is your Inkto code`,
            html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Your Inkto code</title></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:#f9fafb;margin:0;padding:40px 20px;color:#111827;">
    <div style="max-width:480px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
        <div style="background:#111827;padding:20px 24px;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:18px;">Inkto</h1>
        </div>
        <div style="padding:32px;text-align:center;">
            <p style="margin:0 0 24px;font-size:16px;color:#374151;">Your sign-in code:</p>
            <div style="font-size:48px;font-weight:800;letter-spacing:10px;color:#111827;font-family:'Courier New',monospace;margin-bottom:24px;">${otp}</div>
            <p style="margin:0 0 8px;font-size:14px;color:#374151;">Enter this code in the app to continue.</p>
            <p style="margin:0;font-size:12px;color:#6b7280;">Expires in 10 minutes. If you did not request this, ignore it.</p>
        </div>
    </div>
</body>
</html>`
        });

        if (emailError) throw emailError;

        return res.json({ success: true });
    } catch (err) {
        console.error('Send OTP error:', err);
        return res.status(500).json({ error: 'Failed to send code. Please try again.' });
    }
};
