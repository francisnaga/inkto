import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export default function OutputBox({ text, onReset }) {
    const [copied, setCopied] = useState(false);
    const [value, setValue] = useState(text);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text', err);
        }
    };

    return (
        <div className="output-container">
            <div className="output-header">
                <Check size={18} /> Transcription complete
            </div>
            
            <div style={{ position: 'relative' }}>
                <textarea 
                    className="output-textarea"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                />
                <button 
                    className={`copy-btn ${copied ? 'copied' : ''}`}
                    onClick={handleCopy}
                >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'Copied ✓' : 'Copy'}
                </button>
            </div>

            <button 
                className="btn-secondary" 
                style={{ marginTop: '16px' }}
                onClick={onReset}
            >
                ← Start Over / New Document
            </button>
        </div>
    );
}
