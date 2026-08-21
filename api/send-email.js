const { Resend } = require('resend');
const { generateDocx } = require('./_utils/docxGenerator');
const { supabase } = require('./_utils/supabase');
const PDFDocument = require('pdfkit');

// Helper to generate a PDF buffer in memory
function generatePdfBuffer(text, dateStr) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 72, size: 'A4' });
            const buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));

            doc.fontSize(10).fillColor('#888888').text('INKTO TRANSCRIPT', { align: 'left' });
            doc.text(dateStr, { align: 'right' });
            doc.moveDown(0.5);
            doc.moveTo(72, doc.y).lineTo(doc.page.width - 72, doc.y).strokeColor('#CCCCCC').stroke();
            doc.moveDown(1);

            doc.fontSize(12).fillColor('#1C1917').font('Helvetica').text(text, {
                align: 'left',
                lineGap: 6,
            });

            doc.end();
        } catch (err) {
            reject(err);
        }
    });
}

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

    const { text, recipientEmail, sessionId, formats } = req.body || {};
    if (!text || !recipientEmail) {
        return res.status(400).json({ error: 'Missing transcript text or recipient email.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
        return res.status(400).json({ error: 'Invalid email address.' });
    }

    // Default to docx if formats isn't provided (for backwards compatibility)
    const attachDocx = formats ? formats.docx : true;
    const attachPdf = formats ? formats.pdf : false;

    if (!attachDocx && !attachPdf) {
        return res.status(400).json({ error: 'Please select at least one attachment format.' });
    }

    try {
        const dateStr = new Date().toISOString().slice(0, 10);
        const emailAttachments = [];

        if (attachDocx) {
            const docxBuffer = await generateDocx(text);
            emailAttachments.push({
                filename: `inkto-transcript-${dateStr}.docx`,
                content: docxBuffer,
            });
        }

        if (attachPdf) {
            const pdfBuffer = await generatePdfBuffer(text, dateStr);
            emailAttachments.push({
                filename: `inkto-transcript-${dateStr}.pdf`,
                content: pdfBuffer,
            });
        }

        const resend = new Resend(resendKey);
        const sessionUrl = sessionId ? `https://inkto.jointaccount.org/session/${sessionId}` : null;
        
        // Dynamic text based on attachments
        const attachedFormatsStr = attachDocx && attachPdf ? 'Word (.docx) and PDF' : attachDocx ? 'Word (.docx)' : 'PDF';

        const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Inkto Transcript</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 40px 20px; color: #111827;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                <div style="background-color: #111827; padding: 24px 32px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 600; letter-spacing: 0.5px;">Inkto</h1>
                </div>
                <div style="padding: 32px;">
                    <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #374151;">
                        Your document transcription is complete. 
                    </p>
                    <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #374151;">
                        We have attached the final transcript as a fully formatted ${attachedFormatsStr} document to this email.
                    </p>

                    ${sessionUrl ? `
                    <div style="background-color: #f3f4f6; border-left: 4px solid #2563eb; padding: 16px 20px; margin: 32px 0; border-radius: 4px;">
                        <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #111827;">
                            Prefer to edit in your browser?
                        </p>
                        <p style="margin: 0 0 16px; font-size: 14px; color: #4b5563; line-height: 1.5;">
                            You can securely view, edit, and copy this transcript online indefinitely using your session link.
                        </p>
                        <a href="${sessionUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-size: 14px; font-weight: 600;">
                            Open in Inkto
                        </a>
                    </div>
                    ` : ''}

                    <p style="margin: 0; font-size: 14px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 24px;">
                        This is an automated message. Please do not reply directly to this email.
                    </p>
                </div>
            </div>
        </body>
        </html>
        `;

        const { data, error } = await resend.emails.send({
            from: 'Inkto Transcriber <noreply@inkto.jointaccount.org>',
            to: recipientEmail,
            subject: `Inkto Transcript - ${dateStr}`,
            html: emailHtml,
            attachments: emailAttachments
        });

        if (error) {
            console.error('Resend error:', error);
            if (error.statusCode === 403) {
                return res.status(403).json({ error: 'Email sending failed. Please ensure your domain is verified in Resend to send to this address.' });
            }
            return res.status(500).json({ error: 'Failed to send email. Please try again later.' });
        }

        // If email sent successfully, update the document's email address so it appears in their history
        if (sessionId) {
            const db = require('./_utils/supabase').checkSupabase();
            await db.from('documents')
                .update({ 
                    email: recipientEmail.toLowerCase(),
                    expires_at: new Date('2099-12-31T23:59:59.999Z').toISOString()
                })
                .eq('id', sessionId)
                .is('email', null); // Only set if not already set (prevents overtaking)
        }

        return res.json({ success: true });
    } catch (err) {
        console.error('Email generation failed:', err);
        return res.status(500).json({ error: 'Failed to process email request.' });
    }
};
