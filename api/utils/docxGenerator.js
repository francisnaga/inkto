const { Document, Packer, Paragraph, TextRun } = require('docx');

/**
 * Converts plain text into a proper .docx binary buffer.
 * Uses Georgia, 12pt font to match the frontend editor styling.
 */
async function generateDocx(text) {
    const paragraphs = (text || '').split(/\r?\n/).map(line => {
        return new Paragraph({
            children: [
                new TextRun({
                    text: line,
                    font: 'Georgia',
                    size: 24, // 24 half-points = 12pt
                })
            ],
            spacing: {
                after: 200, // Add spacing after paragraphs
                line: 360, // 1.5 line spacing
            }
        });
    });

    const doc = new Document({
        creator: 'Inkto Transcriber',
        title: 'Transcript',
        description: 'Transcribed via Inkto',
        sections: [{
            properties: {},
            children: paragraphs
        }]
    });

    return await Packer.toBuffer(doc);
}

module.exports = { generateDocx };
