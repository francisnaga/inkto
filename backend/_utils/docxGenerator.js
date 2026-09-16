const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, BorderStyle, WidthType } = require('docx');

/**
 * Converts plain text into a proper .docx binary buffer.
 * Parses structured text for numbered lists and tables.
 */
function createTextRuns(text) {
    const runs = [];
    const regex = /(\d+)(st|nd|rd|th)\b/gi;
    let lastIndex = 0;
    let match;
    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            runs.push(new TextRun({ text: text.substring(lastIndex, match.index), font: 'Georgia', size: 24 }));
        }
        runs.push(new TextRun({ text: match[1], font: 'Georgia', size: 24 }));
        // Ensure the suffix is converted to lowercase for aesthetics
        runs.push(new TextRun({ text: match[2].toLowerCase(), font: 'Georgia', size: 24, superScript: true }));
        lastIndex = regex.lastIndex;
    }
    if (lastIndex < text.length) {
        runs.push(new TextRun({ text: text.substring(lastIndex), font: 'Georgia', size: 24 }));
    }
    if (runs.length === 0) {
        runs.push(new TextRun({ text: text || '', font: 'Georgia', size: 24 }));
    }
    return runs;
}

function cleanLatexOrdinals(text) {
    if (!text) return text;
    // Strip LaTeX formatting for ordinals (e.g. $10^{\text{th}}$ or $10^{th}$)
    return text
        .replace(/\$?(\d+)\^\{\\text\{([a-zA-Z]{2})\}\}\$?/gi, '$1$2')
        .replace(/\$?(\d+)\^\{([a-zA-Z]{2})\}\$?/gi, '$1$2');
}

async function generateDocx(text) {
    text = cleanLatexOrdinals(text);
    const lines = (text || '').split(/\r?\n/).filter(line => line.trim() !== '');
    const elements = [];

    let currentTable = null;

    const flushTable = () => {
        if (currentTable) {
            elements.push(new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: {
                    top: { style: BorderStyle.NIL, size: 0, color: "auto" },
                    bottom: { style: BorderStyle.NIL, size: 0, color: "auto" },
                    left: { style: BorderStyle.NIL, size: 0, color: "auto" },
                    right: { style: BorderStyle.NIL, size: 0, color: "auto" },
                    insideHorizontal: { style: BorderStyle.NIL, size: 0, color: "auto" },
                    insideVertical: { style: BorderStyle.NIL, size: 0, color: "auto" },
                },
                rows: currentTable.map(row => {
                    return new TableRow({
                        children: [
                            new TableCell({
                                children: [new Paragraph({ children: createTextRuns(row.left) })],
                                width: { size: 60, type: WidthType.PERCENTAGE }
                            }),
                            new TableCell({
                                children: [new Paragraph({ children: createTextRuns(row.right) })],
                                width: { size: 40, type: WidthType.PERCENTAGE }
                            })
                        ]
                    });
                })
            }));
            // Add spacing after table
            elements.push(new Paragraph({ spacing: { after: 200 } }));
            currentTable = null;
        }
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // 1. Check for Label = Value pairs (Table)
        if (line.includes(' = ') || (line.includes(' - ') && line.match(/\sN?[\d,.]+\s*$/))) {
            const splitChar = line.includes(' = ') ? ' = ' : ' - ';
            const parts = line.split(splitChar);
            if (parts.length === 2) {
                if (!currentTable) currentTable = [];
                currentTable.push({ left: parts[0].trim(), right: parts[1].trim() });
                continue;
            }
        }

        flushTable();

        // 2. Check for Numbered List
        const listMatch = line.match(/^(\d+)\.\s+(.*)/);
        if (listMatch) {
            elements.push(new Paragraph({
                children: createTextRuns(listMatch[2]),
                numbering: { reference: "default-numbering", level: 0 },
                spacing: { after: 120, line: 360 }
            }));
            continue;
        }

        // 3. Check for Lettered List
        const letterMatch = line.match(/^([a-zA-Z])\.\s+(.*)/);
        if (letterMatch) {
            elements.push(new Paragraph({
                children: createTextRuns(letterMatch[2]),
                numbering: { reference: "default-lettering", level: 0 },
                spacing: { after: 120, line: 360 }
            }));
            continue;
        }

        // 4. Default paragraph
        elements.push(new Paragraph({
            children: createTextRuns(line),
            spacing: { after: 200, line: 360 }
        }));
    }

    flushTable();

    const doc = new Document({
        creator: 'Inkto Transcriber',
        title: 'Transcript',
        description: 'Transcribed via Inkto',
        numbering: {
            config: [
                {
                    reference: "default-numbering",
                    levels: [{ level: 0, format: "decimal", text: "%1.", alignment: "left" }]
                },
                {
                    reference: "default-lettering",
                    levels: [{ level: 0, format: "lowerLetter", text: "%1.", alignment: "left" }]
                }
            ]
        },
        sections: [{
            properties: {},
            children: elements
        }]
    });

    return await Packer.toBuffer(doc);
}

module.exports = { generateDocx };
