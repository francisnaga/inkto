const PDFDocument = require('pdfkit');

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { text } = req.body || {};
    if (!text) {
        return res.status(400).json({ error: 'No text provided.' });
    }

    try {
        const dateStr = new Date().toISOString().slice(0, 10);
        const filename = `inkto-transcript-${dateStr}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        const doc = new PDFDocument({ margin: 72, size: 'A4' });
        doc.pipe(res);

        // Header
        doc.fontSize(10).fillColor('#888888').text('INKTO TRANSCRIPT', { align: 'left' });
        doc.text(dateStr, { align: 'right' });
        doc.moveDown(0.5);
        doc.moveTo(72, doc.y).lineTo(doc.page.width - 72, doc.y).strokeColor('#CCCCCC').stroke();
        doc.moveDown(1);

        // Body text
        doc.fontSize(12).fillColor('#1C1917').font('Helvetica').text(text, {
            align: 'left',
            lineGap: 6,
        });

        doc.end();
    } catch (err) {
        console.error('PDF generation failed:', err);
        // Only send JSON error if headers not sent yet
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to generate PDF.' });
        }
    }
};
