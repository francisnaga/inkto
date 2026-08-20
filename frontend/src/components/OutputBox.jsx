import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Copy, Check, RotateCcw, Download, FileText, Printer, ChevronUp } from 'lucide-react';

export default function OutputBox({ text, onReset }) {
    const [value, setValue] = useState(text);
    const [copied, setCopied] = useState(false);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const textareaRef = useRef(null);
    const containerRef = useRef(null);

    // ─── Performance: only recalculate on idle after typing stops ───
    const [deferredValue, setDeferredValue] = useState(text);
    const debounceTimer = useRef(null);

    const handleChange = useCallback((e) => {
        const v = e.target.value;
        setValue(v);
        clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => setDeferredValue(v), 300);
    }, []);

    useEffect(() => () => clearTimeout(debounceTimer.current), []);

    // ─── Memoised stats so large docs never lag the editor ───
    const stats = useMemo(() => {
        const words = deferredValue.trim().split(/\s+/).filter(Boolean).length;
        const chars = deferredValue.length;
        const readMins = Math.max(1, Math.round(words / 200));
        return { words, chars, readMins };
    }, [deferredValue]);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(value);
        } catch {
            const ta = document.createElement('textarea');
            ta.value = value;
            ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    const handleDownload = () => {
        const blob = new Blob([value], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `inkto-transcript-${new Date().toISOString().slice(0, 10)}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handlePrint = () => {
        const win = window.open('', '_blank');
        win.document.write(`<html><head><title>Inkto Transcript</title>
        <style>body{font-family:Georgia,serif;font-size:14pt;line-height:1.8;max-width:700px;margin:40px auto;color:#1a1a1a}pre{white-space:pre-wrap;font-family:inherit}</style>
        </head><body><pre>${value.replace(/</g, '&lt;')}</pre></body></html>`);
        win.document.close();
        win.print();
    };

    const scrollToTop = () => textareaRef.current?.scrollTo({ top: 0, behavior: 'smooth' });

    const handleTextareaScroll = (e) => setShowScrollTop(e.target.scrollTop > 150);

    return (
        <div style={{ animation: 'fadeIn 0.4s ease' }} ref={containerRef}>

            {/* ── Step Label ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <div style={{
                    width: '22px', height: '22px', borderRadius: '50%',
                    background: '#16A34A', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '11px', fontWeight: '800', flexShrink: 0
                }}>✓</div>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>
                    Transcription complete
                </span>
                <div style={{ flex: 1, height: '1px', background: '#E5E7EB' }} />
            </div>

            {/* ── Stats Row ── */}
            <div style={{
                display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap'
            }}>
                {[
                    { label: 'Words', value: stats.words.toLocaleString() },
                    { label: 'Characters', value: stats.chars.toLocaleString() },
                    { label: 'Read time', value: `~${stats.readMins} min` },
                ].map(s => (
                    <div key={s.label} style={{
                        flex: '1', minWidth: '80px',
                        background: '#fff', border: '1px solid #E5E7EB',
                        borderRadius: '10px', padding: '10px 14px',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '17px', fontWeight: '800', color: '#111827', letterSpacing: '-0.5px' }}>
                            {s.value}
                        </div>
                        <div style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: '500', marginTop: '2px' }}>
                            {s.label}
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Main Editor Card ── */}
            <div style={{
                background: '#fff', border: '1px solid #E5E7EB',
                borderRadius: '16px', overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(0,0,0,0.07)',
                marginBottom: '12px'
            }}>
                {/* Toolbar */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', borderBottom: '1px solid #F3F4F6',
                    background: '#FAFAFA', flexWrap: 'wrap', gap: '8px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                        <FileText size={14} color="#9CA3AF" />
                        <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: '600' }}>
                            Transcript
                        </span>
                        <span style={{
                            fontSize: '10px', background: '#EFF6FF', color: '#2563EB',
                            padding: '2px 7px', borderRadius: '99px', fontWeight: '700'
                        }}>
                            Editable
                        </span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                        <ToolBtn icon={<Printer size={13} />} label="Print" onClick={handlePrint} />
                        <ToolBtn icon={<Download size={13} />} label="Save .txt" onClick={handleDownload} />
                        <button
                            onClick={handleCopy}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '5px',
                                padding: '7px 14px',
                                background: copied ? '#DCFCE7' : '#1A1A1A',
                                color: copied ? '#16A34A' : '#fff',
                                border: 'none', borderRadius: '8px',
                                fontSize: '12px', fontWeight: '700', cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            {copied ? <Check size={13} /> : <Copy size={13} />}
                            {copied ? 'Copied!' : 'Copy All'}
                        </button>
                    </div>
                </div>

                {/* Editor wrapper — scroll here, not on page */}
                <div style={{ position: 'relative' }}>
                    <textarea
                        ref={textareaRef}
                        value={value}
                        onChange={handleChange}
                        onScroll={handleTextareaScroll}
                        spellCheck={false}
                        style={{
                            display: 'block',
                            width: '100%',
                            height: '400px',
                            padding: '22px',
                            border: 'none', outline: 'none',
                            fontFamily: 'Georgia, "Times New Roman", serif',
                            fontSize: '15px', lineHeight: '1.9',
                            color: '#1C1C1E', background: '#fff',
                            resize: 'none',
                            boxSizing: 'border-box',
                            overflowY: 'auto',
                            WebkitOverflowScrolling: 'touch',
                        }}
                    />
                    {/* Scroll-to-top */}
                    {showScrollTop && (
                        <button
                            onClick={scrollToTop}
                            style={{
                                position: 'absolute', bottom: '12px', right: '12px',
                                width: '32px', height: '32px',
                                background: 'rgba(0,0,0,0.65)', border: 'none',
                                borderRadius: '50%', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                backdropFilter: 'blur(4px)', transition: 'opacity 0.2s',
                                animation: 'fadeIn 0.2s ease'
                            }}
                        >
                            <ChevronUp size={16} color="white" />
                        </button>
                    )}
                </div>

                {/* Footer hint */}
                <div style={{
                    padding: '8px 16px', borderTop: '1px solid #F9FAFB',
                    background: '#FAFAFA',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                    <span style={{ fontSize: '11px', color: '#D1D5DB' }}>
                        Tap inside to edit · Changes are local only
                    </span>
                    <span style={{ fontSize: '11px', color: '#D1D5DB' }}>
                        Inkto
                    </span>
                </div>
            </div>

            {/* ── New Document ── */}
            <button
                onClick={onReset}
                style={{
                    width: '100%', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: '8px',
                    padding: '14px', background: '#F9FAFB',
                    border: '1px solid #E5E7EB', borderRadius: '12px',
                    fontSize: '14px', fontWeight: '600', color: '#374151',
                    cursor: 'pointer', transition: 'all 0.2s'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#F3F4F6'; e.currentTarget.style.borderColor = '#D1D5DB'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#F9FAFB'; e.currentTarget.style.borderColor = '#E5E7EB'; }}
            >
                <RotateCcw size={14} /> Start New Document
            </button>
        </div>
    );
}

function ToolBtn({ icon, label, onClick }) {
    return (
        <button
            onClick={onClick}
            style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '7px 12px', background: '#F3F4F6',
                border: 'none', borderRadius: '8px',
                fontSize: '12px', fontWeight: '600', color: '#374151',
                cursor: 'pointer', transition: 'background 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#E5E7EB'}
            onMouseLeave={e => e.currentTarget.style.background = '#F3F4F6'}
        >
            {icon} {label}
        </button>
    );
}
