'use client';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect, useRef } from 'react';

// Converts plain text with newlines into Tiptap-friendly HTML with elegant legal typography
function textToHtml(text: string) {
    if (!text) return '';
    if (text.includes('<p>') || text.includes('<h3>') || text.includes('<h2>') || text.includes('transcript-page-divider')) return text;

    const lines = text.split('\n');
    const htmlBlocks: string[] = [];

    const isHeading = (line: string) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.length > 85) return false;
        
        // Skip page dividers
        if (/^-{2,}\s*Page\s+\d+\s*-{2,}$/i.test(trimmed)) return false;
        
        // Match section titles ending with a colon: e.g. "TORSION:", "PARTICULARS OF CLAIM:", "STATEMENT OF FACTS:"
        if (/^[A-Z0-9\s,–\-\/\(\)\.]{3,}:$/i.test(trimmed) && trimmed.length <= 65) return true;
        
        // Match ALL-CAPS lines: e.g. "IN THE HIGH COURT OF LAGOS STATE", "MEMORANDUM OF AGREEMENT", "SUIT NO: LD/123/2026", "BETWEEN:", "AND"
        const lettersOnly = trimmed.replace(/[^A-Za-z]/g, '');
        if (lettersOnly.length >= 4 && lettersOnly === lettersOnly.toUpperCase() && trimmed.length <= 75) {
            return true;
        }

        // Match numbered section headers like "1. DEFINITIONS AND INTERPRETATIONS"
        if (/^\d+\.\s+[A-Z\s]{4,}$/.test(trimmed)) return true;

        return false;
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        if (!trimmed) {
            continue;
        }

        const pageMatch = trimmed.match(/^-{2,}\s*Page\s+(\d+)\s*-{2,}$/i);
        if (pageMatch) {
            const pageNum = pageMatch[1];
            htmlBlocks.push(
                `<div class="transcript-page-divider"><span class="transcript-page-badge">PAGE ${pageNum}</span></div>`
            );
            continue;
        }

        if (isHeading(trimmed)) {
            htmlBlocks.push(`<h3 class="transcript-heading">${trimmed}</h3>`);
        } else {
            htmlBlocks.push(`<p class="transcript-paragraph">${trimmed}</p>`);
        }
    }

    return htmlBlocks.length > 0 ? htmlBlocks.join('') : '<p class="transcript-paragraph"></p>';
}

export default function RichEditor({
    content,
    readOnly,
    onChange,
    style
}: {
    content: string;
    readOnly: boolean;
    onChange: (val: string) => void;
    style?: React.CSSProperties;
}) {
    const isFirstRender = useRef(true);
    const editor = useEditor({
        extensions: [StarterKit],
        content: textToHtml(content),
        editable: !readOnly,
        onUpdate: ({ editor }) => {
            // Get text with block separation to preserve newlines
            onChange(editor.getText({ blockSeparator: '\n' }));
        },
        editorProps: {
            attributes: {
                class: 'transcript-editor focus:outline-none max-w-none',
                style: `min-height: 100%; outline: none; padding-bottom: 2rem;`
            },
        },
    });

    useEffect(() => {
        if (editor && editor.isEditable === readOnly) {
            editor.setEditable(!readOnly);
        }
    }, [editor, readOnly]);

    // Handle initial content load from AI
    useEffect(() => {
        if (editor && isFirstRender.current && content) {
            isFirstRender.current = false;
            if (editor.getText({ blockSeparator: '\n' }) !== content) {
                editor.commands.setContent(textToHtml(content));
            }
        }
    }, [content, editor]);

    if (!editor) return null;

    return (
        <div style={{ ...style, position: 'relative' }}>
            <style>{`
                .transcript-editor {
                    font-family: -apple-system, "Segoe UI", Roboto, sans-serif;
                    color: #0B0D12;
                    line-height: 1.75;
                    font-size: 15px;
                }
                .transcript-editor .transcript-page-divider {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                    margin: 32px 0 24px;
                    text-align: center;
                }
                .transcript-editor .transcript-page-divider::before {
                    content: '';
                    position: absolute;
                    left: 0;
                    right: 0;
                    top: 50%;
                    height: 1px;
                    background: #E4E1D9;
                    z-index: 1;
                }
                .transcript-editor .transcript-page-badge {
                    position: relative;
                    z-index: 2;
                    background: #EEF2F8;
                    color: #24467A;
                    font-family: -apple-system, "Segoe UI", Roboto, sans-serif;
                    font-size: 11px;
                    font-weight: 700;
                    letter-spacing: 0.1em;
                    padding: 3px 12px;
                    border-radius: 99px;
                    border: 1px solid #D2DDF0;
                    text-transform: uppercase;
                }
                .transcript-editor .transcript-heading {
                    font-family: Georgia, "Iowan Old Style", "Times New Roman", serif;
                    font-size: 17px;
                    font-weight: 700;
                    color: #0B0D12;
                    letter-spacing: 0.02em;
                    margin-top: 24px;
                    margin-bottom: 8px;
                    line-height: 1.4;
                }
                .transcript-editor .transcript-paragraph {
                    font-family: -apple-system, "Segoe UI", Roboto, sans-serif;
                    font-size: 15px;
                    line-height: 1.75;
                    color: #1F2228;
                    margin-top: 0;
                    margin-bottom: 18px;
                }
                .transcript-editor p:not(.transcript-paragraph) {
                    margin-top: 0;
                    margin-bottom: 18px;
                    line-height: 1.75;
                }
            `}</style>
            <EditorContent editor={editor} />
        </div>
    );
}
