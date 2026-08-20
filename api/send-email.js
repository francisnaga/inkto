const { Resend } = require('resend');
const { generateDocx } = require('./utils/docxGenerator');

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
        return res.status(500).json({ error: 'Email service is not configured (missing API key).' });
    }

    const { text, recipientEmail } = req.body || {};
    if (!text || !recipientEmail) {
        return res.status(400).json({ error: 'Missing transcript text or recipient email.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
        return res.status(400).json({ error: 'Invalid email address.' });
    }

    try {
        const docxBuffer = await generateDocx(text);
        const resend = new Resend(resendKey);
        
        const dateStr = new Date().toISOString().slice(0, 10);

        const { data, error } = await resend.emails.send({
            from: 'Inkto Transcriber <noreply@inkto.jointaccount.org>',
            to: recipientEmail,
            subject: `Inkto Transcript - ${dateStr}`,
            html: '<p>Here is your transcribed legal document attached as a Microsoft Word (.docx) file.</p><p><i>Sent securely from Inkto.</i></p>',
            attachments: [
                {
                    filename: `inkto-transcript-${dateStr}.docx`,
                    content: docxBuffer,
                }
            ]
        });

        if (error) {
            console.error('Resend error:', error);
            // Translate common Resend errors
            if (error.statusCode === 403) {
                return res.status(403).json({ error: 'Email sending failed. Please ensure your domain is verified in Resend to send to this address.' });
            }
            return res.status(500).json({ error: 'Failed to send email. Please try again later.' });
        }

        return res.json({ success: true });
    } catch (err) {
        console.error('Email generation failed:', err);
        return res.status(500).json({ error: 'Failed to process email request.' });
    }
};
