'use client';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect, useRef } from 'react';

export default function RichEditor({ content, readOnly, onChange, style }) {
    const isFirstRender = useRef(true);
    const editor = useEditor({
        extensions: [StarterKit],
        content: content,
        editable: !readOnly,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
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

    if (!editor) return null;

    return (
        <div style={style}>
            <EditorContent editor={editor} />
        </div>
    );
}
