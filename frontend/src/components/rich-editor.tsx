'use client';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect, useRef } from 'react';

// Converts plain text with newlines into Tiptap-friendly HTML paragraphs
function textToHtml(text: string) {
    if (!text || text.includes('<p>')) return text;
    return text.split('\n').map(line => `<p>${line}</p>`).join('');
}

export default function RichEditor({ content, readOnly, onChange, style }: { content: string, readOnly: boolean, onChange: (val: string) => void, style?: React.CSSProperties }) {
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
                class: 'prose focus:outline-none max-w-none',
                style: `min-height: 100%; outline: none; padding-bottom: 2rem; font-family: inherit; font-size: inherit; line-height: inherit; color: inherit;`
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
        <div style={style}>
            <EditorContent editor={editor} />
        </div>
    );
}
