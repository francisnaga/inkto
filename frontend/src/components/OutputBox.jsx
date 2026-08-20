import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Copy, Check, RotateCcw, Download, FileText, Printer, ChevronUp, Mail, Share2, FileDown, X } from 'lucide-react';

export default function OutputBox({ text, sessionId, onReset }) {
    const [value, setValue] = useState(text);
    const [copied, setCopied] = useState(false);
    const [linkCopied, setLinkCopied] = useState(false);
    const [showScrollTop, setShowScrollTop] = useState(false);

    // Which action panel is open: null | 'email' | 'share'
    const [activePanel, setActivePanel] = useState(null);

    // Email state
    const [email, setEmail] = useState(() => localStorage.getItem('inkto_last_email') || '');
    const [sendingEmail, setSendingEmail] = useState(false);
    const [emailStatus, setEmailStatus] = useState(null);

    const textareaRef = useRef(null);

    const [deferredValue, setDeferredValue] = useState(text);
    const debounceTimer = useRef(null);

    const handleChange = useCallback((e) => {
        const v = e.target.value;
        setValue(v);
        clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => setDeferredValue(v), 300);
    }, []);

    useEffect(() => () => clearTimeout(debounceTimer.current), []);

    const stats = useMemo(() => {
        const words = deferredValue.trim().split(/\s+/).filter(Boolean).length;
        return { words, chars: deferredValue.length };
    }, [deferredValue]);

    const handleCopy = async () => {
        try { await navigator.clipboard.writeText(value); }
        catch {
            const ta = document.createElement('textarea');
            ta.value = value;
            ta.style.cssText = 'position:fixed;opacity:0';
            document.body.appendChild(ta); ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    const handleCopyLink = async () => {
        const link = `${window.location.origin}/session/${sessionId}`;
        try { await navigator.clipboard.writeText(link); }
        catch { /* fallback not needed for links */ }
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2500);
    };

    const handleDownloadTxt = () => {
        const blob = new Blob([value], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `inkto-transcript-${new Date().toISOString().slice(0,10)}.txt`;
        a.click(); URL.revokeObjectURL(url);
    };

    const handleDownloadDocx = async () => {
        try {
            const res = await fetch('/api/download-docx', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: value })
            });
            if (!res.ok) throw new Error();
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `inkto-transcript-${new Date().toISOString().slice(0,10)}.docx`;
            a.click(); URL.revokeObjectURL(url);
        } catch {
            alert('Could not generate Word document. Try the .txt download instead.');
        }
    };

    const handleSendEmail = async () => {
        if (!email || !email.includes('@')) {
            setEmailStatus({ type: 'error', msg: 'Please enter a valid email address.' });
            return;
        }
        setSendingEmail(true);
        setEmailStatus(null);
        localStorage.setItem('inkto_last_email', email);
        try {
            const res = await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: value, recipientEmail: email, sessionId })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to send email');
            setEmailStatus({ type: 'success', msg: '✓ Sent! Check your inbox.' });
            setTimeout(() => { setEmailStatus(null); setActivePanel(null); }, 4000);
        } catch (err) {
            setEmailStatus({ type: 'error', msg: err.message });
        } finally {
            setSendingEmail(false);
        }
    };

    const handlePrint = () => {
        const win = window.open('', '_blank');
        win.document.write(`<html><head><title>Inkto Transcript</title>
        <style>body{font-family:Georgia,serif;font-size:14pt;line-height:1.8;max-width:700px;margin:40px auto;color:#1a1a1a}pre{white-space:pre-wrap;font-family:inherit}</style>
        </head><body><pre>${value.replace(/</g,'&lt;')}</pre></body></html>`);
        win.document.close(); win.print();
    };

    const scrollToTop = () => textareaRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    const togglePanel = (name) => setActivePanel(p => p === name ? null : name);

    return (
        <div style={{ animation: 'fadeIn 0.4s ease' }}>

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
                <span style={{ fontSize: '11px', color: '#9CA3AF', whiteSpace: 'nowrap' }}>
                    {stats.words.toLocaleString()} words
                </span>
            </div>

            {/* ── Main Card ── */}
            <div style={{
                background: '#fff', border: '1px solid #E5E7EB',
                borderRadius: '16px', overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(0,0,0,0.07)',
                marginBottom: '12px'
            }}>
                {/* ── Top Toolbar: Copy / Print / Download ── */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', borderBottom: '1px solid #F3F4F6',
                    background: '#FAFAFA', gap: '8px', flexWrap: 'wrap'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FileText size={14} color="#9CA3AF" />
                        <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: '600' }}>Transcript</span>
                        <span style={{
                            fontSize: '10px', background: '#EFF6FF', color: '#2563EB',
                            padding: '2px 7px', borderRadius: '99px', fontWeight: '700'
                        }}>Editable</span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <ToolBtn icon={<Printer size={13} />} label="Print" onClick={handlePrint} />
                        <ToolBtn icon={<Download size={13} />} label=".txt" onClick={handleDownloadTxt} />
                        <ToolBtn icon={<FileDown size={13} color="#2563EB" />} label=".docx" onClick={handleDownloadDocx} primary />
                        <button onClick={handleCopy} style={{
                            display: 'flex', alignItems: 'center', gap: '5px',
                            padding: '7px 14px',
                            background: copied ? '#DCFCE7' : '#1A1A1A',
                            color: copied ? '#16A34A' : '#fff',
                            border: 'none', borderRadius: '8px',
                            fontSize: '12px', fontWeight: '700', cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}>
                            {copied ? <Check size={13} /> : <Copy size={13} />}
                            {copied ? 'Copied!' : 'Copy'}
                        </button>
                    </div>
                </div>

                {/* ── Bottom Toolbar: Email / Share ── */}
                <div style={{
                    display: 'flex', gap: '8px',
                    padding: '10px 14px', borderBottom: '1px solid #F3F4F6',
                    background: '#F8FAFC'
                }}>
                    <ActionToggleBtn
                        icon={<Mail size={14} />}
                        label="Email as .docx"
                        active={activePanel === 'email'}
                        onClick={() => togglePanel('email')}
                        color="#374151"
                    />
                    <ActionToggleBtn
                        icon={<Share2 size={14} />}
                        label={sessionId ? 'Copy share link' : 'Share link (processing…)'}
                        active={activePanel === 'share'}
                        onClick={() => sessionId && togglePanel('share')}
                        color="#2563EB"
                        disabled={!sessionId}
                    />
                </div>

                {/* ── Email Panel ── */}
                {activePanel === 'email' && (
                    <div style={{
                        padding: '16px', borderBottom: '1px solid #F3F4F6',
                        background: '#fff', animation: 'fadeIn 0.2s ease'
                    }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                            <div style={{ flex: 1 }}>
                                <input
                                    type="email"
                                    autoFocus
                                    placeholder="recipient@example.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSendEmail()}
                                    style={{
                                        width: '100%', padding: '10px 14px', borderRadius: '8px',
                                        border: `1px solid ${emailStatus?.type === 'error' ? '#FCA5A5' : '#D1D5DB'}`,
                                        fontSize: '14px', outline: 'none', boxSizing: 'border-box',
                                        fontFamily: 'inherit'
                                    }}
                                />
                                {emailStatus && (
                                    <p style={{
                                        margin: '8px 0 0', fontSize: '13px', fontWeight: '500',
                                        color: emailStatus.type === 'success' ? '#16A34A' : '#DC2626'
                                    }}>{emailStatus.msg}</p>
                                )}
                            </div>
                            <button
                                onClick={handleSendEmail}
                                disabled={sendingEmail}
                                style={{
                                    padding: '10px 18px', background: '#111827', color: '#fff',
                                    border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700',
                                    cursor: sendingEmail ? 'wait' : 'pointer',
                                    opacity: sendingEmail ? 0.6 : 1, whiteSpace: 'nowrap',
                                    transition: 'opacity 0.2s'
                                }}
                            >
                                {sendingEmail ? 'Sending…' : 'Send →'}
                            </button>
                        </div>
                        <p style={{ margin: '8px 0 0', fontSize: '11px', color: '#9CA3AF' }}>
                            Sends a .docx attachment + a secure link to open this transcript in your browser.
                        </p>
                    </div>
                )}

                {/* ── Share Panel ── */}
                {activePanel === 'share' && sessionId && (
                    <div style={{
                        padding: '16px', borderBottom: '1px solid #F3F4F6',
                        background: '#F0F9FF', animation: 'fadeIn 0.2s ease'
                    }}>
                        <p style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: '600', color: '#0F4C81' }}>
                            Open this transcript on your PC — link expires in 7 days
                        </p>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <div style={{
                                flex: 1, padding: '10px 14px', borderRadius: '8px',
                                background: '#fff', border: '1px solid #BAE6FD',
                                fontSize: '13px', color: '#0369A1', overflowX: 'auto',
                                whiteSpace: 'nowrap', fontFamily: 'monospace'
                            }}>
                                {window.location.origin}/session/{sessionId}
                            </div>
                            <button
                                onClick={handleCopyLink}
                                style={{
                                    padding: '10px 18px',
                                    background: linkCopied ? '#2563EB' : '#0EA5E9',
                                    color: '#fff', border: 'none', borderRadius: '8px',
                                    fontSize: '13px', fontWeight: '700',
                                    cursor: 'pointer', transition: 'all 0.2s',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                {linkCopied ? '✓ Copied!' : 'Copy'}
                            </button>
                        </div>
                    </div>
                )}

                {/* ── Editor ── */}
                <div style={{ position: 'relative' }}>
                    <textarea
                        ref={textareaRef}
                        value={value}
                        onChange={handleChange}
                        onScroll={e => setShowScrollTop(e.target.scrollTop > 150)}
                        spellCheck={false}
                        style={{
                            display: 'block', width: '100%', height: '380px',
                            padding: '22px', border: 'none', outline: 'none',
                            fontFamily: 'Georgia, "Times New Roman", serif',
                            fontSize: '15px', lineHeight: '1.9',
                            color: '#1C1C1E', background: '#fff',
                            resize: 'none', boxSizing: 'border-box',
                            overflowY: 'auto', WebkitOverflowScrolling: 'touch',
                        }}
                    />
                    {showScrollTop && (
                        <button onClick={scrollToTop} style={{
                            position: 'absolute', bottom: '12px', right: '12px',
                            width: '32px', height: '32px',
                            background: 'rgba(0,0,0,0.65)', border: 'none', borderRadius: '50%',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            backdropFilter: 'blur(4px)', animation: 'fadeIn 0.2s ease'
                        }}>
                            <ChevronUp size={16} color="white" />
                        </button>
                    )}
                </div>

                {/* Footer hint */}
                <div style={{
                    padding: '8px 16px', borderTop: '1px solid #F9FAFB',
                    background: '#FAFAFA', display: 'flex', justifyContent: 'space-between'
                }}>
                    <span style={{ fontSize: '11px', color: '#D1D5DB' }}>Tap to edit · changes are local</span>
                    <span style={{ fontSize: '11px', color: '#D1D5DB' }}>Inkto</span>
                </div>
            </div>

            {/* ── New Document ── */}
            <button onClick={onReset} style={{
                width: '100%', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: '8px', padding: '14px',
                background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '12px',
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

function ToolBtn({ icon, label, onClick, primary }) {
    return (
        <button onClick={onClick} style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            padding: '7px 12px', background: primary ? '#EFF6FF' : '#F3F4F6',
            border: 'none', borderRadius: '8px',
            fontSize: '12px', fontWeight: '600', color: primary ? '#2563EB' : '#374151',
            cursor: 'pointer', transition: 'background 0.15s'
        }}>
            {icon} {label}
        </button>
    );
}

function ActionToggleBtn({ icon, label, active, onClick, color, disabled }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 14px', borderRadius: '8px',
                border: `1px solid ${active ? color : '#E5E7EB'}`,
                background: active ? (color === '#2563EB' ? '#EFF6FF' : '#F3F4F6') : '#fff',
                color: active ? color : '#6B7280',
                fontSize: '13px', fontWeight: '600',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.4 : 1,
                transition: 'all 0.2s'
            }}
        >
            {icon} {label}
        </button>
    );
}
