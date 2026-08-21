const { nanoid } = require('nanoid');
const { Resend } = require('resend');
const { supabase } = require('./utils/supabase');

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
        const token = nanoid(32);
        
        // Token expires in 15 mins
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 15);

        const db = require('./utils/supabase').checkSupabase();

        const { error: dbError } = await db.from('auth_tokens').insert([{
            token,
            email: email.toLowerCase(),
            expires_at: expiresAt.toISOString(),
            used: false
        }]);

        if (dbError) throw dbError;

        const resend = new Resend(resendKey);
        
        // Build the verify URL (assuming frontend runs on the same domain in prod)
        // For local dev, we might need a dynamic host, but typically Vercel gives us standard headers
        const protocol = req.headers['x-forwarded-proto'] || 'https';
        const host = req.headers['x-forwarded-host'] || req.headers.host || 'inkto.jointaccount.org';
        const verifyUrl = `${protocol}://${host}/api/verify?token=${token}`;

        const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Inkto Login</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 40px 20px; color: #111827;">
            <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
                <div style="background-color: #111827; padding: 20px 24px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 18px;">Inkto History</h1>
                </div>
                <div style="padding: 32px;">
                    <p style="margin: 0 0 16px; font-size: 16px; color: #374151;">
                        Click the button below to view your transcription history.
                    </p>
                    <a href="${verifyUrl}" style="display: inline-block; background-color: #111827; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: 600; margin-bottom: 24px;">
                        Sign in to Inkto
                    </a>
                    <p style="margin: 0; font-size: 12px; color: #6b7280;">
                        This link expires in 15 minutes. If you did not request this, you can ignore it.
                    </p>
                </div>
            </div>
        </body>
        </html>
        `;

        const { error: emailError } = await resend.emails.send({
            from: 'Inkto Transcriber <noreply@inkto.jointaccount.org>',
            to: email,
            subject: 'Sign in to Inkto',
            html: emailHtml
        });

        if (emailError) throw emailError;

        return res.json({ success: true });
    } catch (err) {
        console.error('Failed to send history link:', err);
        return res.status(500).json({ error: 'Failed to request magic link.' });
    }
};
