import React, { useState } from 'react';
import { Copy, Check, RotateCcw, Download, FileText } from 'lucide-react';

export default function OutputBox({ text, onReset }) {
    const [copied, setCopied] = useState(false);
    const [value, setValue] = useState(text);

    const wordCount = value.trim().split(/\s+/).filter(Boolean).length;
    const charCount = value.length;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        } catch (err) {
            // Fallback for mobile browsers
            const ta = document.createElement('textarea');
            ta.value = value;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        }
    };

    const handleDownload = () => {
        const blob = new Blob([value], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `inkto-transcript-${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div style={{ animation: 'fadeIn 0.4s ease' }}>
            {/* Success Banner */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                background: '#F0FDF4', border: '1px solid #BBF7D0',
                borderRadius: '12px', padding: '14px 18px', marginBottom: '16px'
            }}>
                <div style={{
                    width: '28px', height: '28px', background: '#16A34A',
                    borderRadius: '50%', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', flexShrink: 0
                }}>
                    <Check size={16} color="white" strokeWidth={3} />
                </div>
                <div>
                    <div style={{ fontWeight: '600', fontSize: '14px', color: '#15803D' }}>Transcription complete</div>
                    <div style={{ fontSize: '12px', color: '#16A34A', marginTop: '1px' }}>
                        {wordCount.toLocaleString()} words · {charCount.toLocaleString()} characters
                    </div>
                </div>
            </div>

            {/* Text Area Card */}
            <div style={{
                background: '#fff', border: '1px solid #E5E7EB',
                borderRadius: '16px', overflow: 'hidden',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                marginBottom: '16px'
            }}>
                {/* Card Header */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 16px', borderBottom: '1px solid #F3F4F6',
                    background: '#FAFAFA'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileText size={14} color="#9CA3AF" />
                        <span style={{ fontSize: '13px', color: '#6B7280', fontWeight: '500' }}>Transcribed Text</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={handleDownload}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '5px',
                                padding: '6px 12px', background: '#F3F4F6',
                                border: 'none', borderRadius: '8px',
                                fontSize: '12px', fontWeight: '600', color: '#374151', cursor: 'pointer'
                            }}
                        >
                            <Download size={12} /> Save
                        </button>
                        <button
                            onClick={handleCopy}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '5px',
                                padding: '6px 12px',
                                background: copied ? '#F0FDF4' : '#1A1A1A',
                                border: 'none', borderRadius: '8px',
                                fontSize: '12px', fontWeight: '600',
                                color: copied ? '#16A34A' : '#fff', cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            {copied ? <Check size={12} /> : <Copy size={12} />}
                            {copied ? 'Copied!' : 'Copy'}
                        </button>
                    </div>
                </div>

                {/* Editable Text Area */}
                <textarea
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    style={{
                        width: '100%', minHeight: '320px',
                        padding: '20px', border: 'none', outline: 'none',
                        fontFamily: 'Georgia, "Times New Roman", serif',
                        fontSize: '15px', lineHeight: '1.8',
                        color: '#1F2937', background: '#fff',
                        resize: 'vertical'
                    }}
                />
            </div>

            {/* Note */}
            <p style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '16px', textAlign: 'center' }}>
                You can edit the text above before copying or saving.
            </p>

            {/* Start Over */}
            <button
                onClick={onReset}
                style={{
                    width: '100%', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: '8px',
                    padding: '14px', background: '#F9FAFB',
                    border: '1px solid #E5E7EB', borderRadius: '12px',
                    fontSize: '14px', fontWeight: '600', color: '#374151',
                    cursor: 'pointer', transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#F3F4F6'}
                onMouseOut={(e) => e.currentTarget.style.background = '#F9FAFB'}
            >
                <RotateCcw size={15} /> New Document
            </button>
        </div>
    );
}
