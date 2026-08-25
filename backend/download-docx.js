const { generateDocx } = require('./_utils/docxGenerator');

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { text } = req.body || {};
    if (!text) {
        return res.status(400).json({ error: 'No text provided to generate document.' });
    }

    try {
        const buffer = await generateDocx(text);
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="inkto-transcript.docx"`);
        res.setHeader('Content-Length', buffer.length);
        
        return res.status(200).send(buffer);
    } catch (err) {
        console.error('DOCX generation failed:', err);
        return res.status(500).json({ error: 'Failed to generate Word document.' });
    }
};
