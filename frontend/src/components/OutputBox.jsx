import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
    Copy, Check, RotateCcw, Download, FileText,
    Printer, ChevronUp, Share2, FileDown, Mail, Monitor
} from 'lucide-react';

export default function OutputBox({ text, sessionId, onReset }) {
    const [value, setValue] = useState(text);
    const [copied, setCopied] = useState(false);
    const [linkCopied, setLinkCopied] = useState(false);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [shareOpen, setShareOpen] = useState(false);

    // Email state
    const [email, setEmail] = useState(() => localStorage.getItem('inkto_last_email') || '');
    const [sendingEmail, setSendingEmail] = useState(false);
    const [emailStatus, setEmailStatus] = useState(null);
    const [emailFocused, setEmailFocused] = useState(false);

    const textareaRef = useRef(null);
    const debounceTimer = useRef(null);
    const [deferredValue, setDeferredValue] = useState(text);

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
            ta.value = value; ta.style.cssText = 'position:fixed;opacity:0';
            document.body.appendChild(ta); ta.select();
            document.execCommand('copy'); document.body.removeChild(ta);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    const handleCopyLink = async () => {
        const link = `${window.location.origin}/session/${sessionId}`;
        try { await navigator.clipboard.writeText(link); } catch {}
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2500);
    };

    const handleDownloadTxt = () => {
        const blob = new Blob([value], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `inkto-transcript-${new Date().toISOString().slice(0, 10)}.txt`;
        a.click(); URL.revokeObjectURL(url);
    };

    const handleDownloadDocx = async () => {
        try {
            const res = await fetch('/api/download-docx', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: value })
            });
            if (!res.ok) throw new Error();
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = `inkto-transcript-${new Date().toISOString().slice(0, 10)}.docx`;
            a.click(); URL.revokeObjectURL(url);
        } catch { alert('Could not generate Word document. Try .txt instead.'); }
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
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: value, recipientEmail: email, sessionId })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to send email');
            setEmailStatus({ type: 'success', msg: '✓ Sent! Check your inbox.' });
            setTimeout(() => { setEmailStatus(null); setShareOpen(false); }, 4000);
        } catch (err) {
            setEmailStatus({ type: 'error', msg: err.message });
        } finally { setSendingEmail(false); }
    };

    const handlePrint = () => {
        const win = window.open('', '_blank');
        win.document.write(`<html><head><title>Inkto Transcript</title>
        <style>body{font-family:Georgia,serif;font-size:14pt;line-height:1.9;max-width:700px;margin:60px auto;color:#1a1a1a}pre{white-space:pre-wrap;font-family:inherit}</style>
        </head><body><pre>${value.replace(/</g, '&lt;')}</pre></body></html>`);
        win.document.close(); win.print();
    };

    const scrollToTop = () => textareaRef.current?.scrollTo({ top: 0, behavior: 'smooth' });

    return (
        <div style={{ animation: 'fadeIn 0.4s ease' }}>

            {/* ── Success Banner ── */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px'
            }}>
                <div style={{
                    width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
                    background: '#15803D', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '13px', fontWeight: '800'
                }}>✓</div>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#44403C' }}>
                    Transcription complete
                </span>
                <div style={{ flex: 1, height: '1px', background: '#E4E2DC' }} />
                <span style={{ fontSize: '11px', color: '#A8A29E', whiteSpace: 'nowrap' }}>
                    {stats.words.toLocaleString()} words · {stats.chars.toLocaleString()} chars
                </span>
            </div>

            {/* ── Main Card ── */}
            <div style={{
                background: '#fff', border: '1px solid #E4E2DC',
                borderRadius: '18px', overflow: 'hidden',
                boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
                marginBottom: '12px'
            }}>
                {/* Toolbar */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '11px 16px', borderBottom: '1px solid #F0EFEB',
                    background: '#FAFAF9', gap: '8px', flexWrap: 'wrap'
                }}>
                    {/* Left: Label + Share */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <FileText size={13} color="#A8A29E" />
                            <span style={{ fontSize: '12px', color: '#78716C', fontWeight: '600' }}>Transcript</span>
                            <span style={{
                                fontSize: '10px', background: '#EFF6FF', color: '#1D4ED8',
                                padding: '2px 8px', borderRadius: '99px', fontWeight: '700', letterSpacing: '0.02em'
                            }}>Editable</span>
                        </div>
                        <div style={{ width: '1px', height: '16px', background: '#E4E2DC' }} />
                        <button
                            onClick={() => setShareOpen(o => !o)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '6px 12px', borderRadius: '7px',
                                border: `1.5px solid ${shareOpen ? '#1D4ED8' : '#E4E2DC'}`,
                                background: shareOpen ? '#EFF6FF' : '#fff',
                                color: shareOpen ? '#1D4ED8' : '#44403C',
                                fontSize: '12px', fontWeight: '700',
                                cursor: 'pointer', transition: 'all 0.2s',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            <Share2 size={13} />
                            Share &amp; Email
                        </button>
                    </div>

                    {/* Right: Actions */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <SmallBtn icon={<Printer size={12} />} label="Print" onClick={handlePrint} />
                        <SmallBtn icon={<Download size={12} />} label=".txt" onClick={handleDownloadTxt} />
                        <SmallBtn icon={<FileDown size={12} color="#1D4ED8" />} label=".docx" onClick={handleDownloadDocx} accent />
                        <button onClick={handleCopy} style={{
                            display: 'flex', alignItems: 'center', gap: '5px',
                            padding: '6px 14px',
                            background: copied ? '#DCFCE7' : '#1C1917',
                            color: copied ? '#15803D' : '#fff',
                            border: 'none', borderRadius: '7px',
                            fontSize: '12px', fontWeight: '700', cursor: 'pointer',
                            transition: 'all 0.2s', whiteSpace: 'nowrap'
                        }}>
                            {copied ? <Check size={12} /> : <Copy size={12} />}
                            {copied ? 'Copied!' : 'Copy'}
                        </button>
                    </div>
                </div>

                {/* ── Share & Email Panel ── */}
                {shareOpen && (
                    <div style={{
                        borderBottom: '1px solid #F0EFEB',
                        background: '#FDFCFB',
                        animation: 'fadeSlideDown 0.2s ease'
                    }}>
                        {/* Section: Email */}
                        <div style={{ padding: '20px 20px 0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                <div style={{
                                    width: '28px', height: '28px', borderRadius: '7px',
                                    background: '#1C1917', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <Mail size={14} color="#fff" />
                                </div>
                                <div>
                                    <p style={{ fontSize: '13px', fontWeight: '700', color: '#1C1917', margin: 0 }}>
                                        Email to yourself
                                    </p>
                                    <p style={{ fontSize: '11px', color: '#A8A29E', margin: 0 }}>
                                        Sends the .docx file + a secure link to open this transcript on PC
                                    </p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '20px' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{
                                        borderRadius: '9px',
                                        border: `1.5px solid ${emailFocused ? '#1D4ED8' : emailStatus?.type === 'error' ? '#FCA5A5' : '#D6D3CE'}`,
                                        transition: 'border-color 0.2s',
                                        boxShadow: emailFocused ? '0 0 0 3px rgba(29,78,216,0.1)' : 'none',
                                        background: '#fff'
                                    }}>
                                        <input
                                            type="email"
                                            autoFocus
                                            placeholder="your@email.com"
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            onFocus={() => setEmailFocused(true)}
                                            onBlur={() => setEmailFocused(false)}
                                            onKeyDown={e => e.key === 'Enter' && handleSendEmail()}
                                            style={{
                                                width: '100%', padding: '10px 14px',
                                                border: 'none', outline: 'none',
                                                fontSize: '14px', fontFamily: 'inherit',
                                                background: 'transparent', borderRadius: '9px',
                                                color: '#1C1917'
                                            }}
                                        />
                                    </div>
                                    {emailStatus && (
                                        <p style={{
                                            margin: '7px 0 0', fontSize: '12px', fontWeight: '600',
                                            color: emailStatus.type === 'success' ? '#15803D' : '#B91C1C'
                                        }}>{emailStatus.msg}</p>
                                    )}
                                </div>
                                <button
                                    onClick={handleSendEmail}
                                    disabled={sendingEmail}
                                    style={{
                                        width: '110px', padding: '10px 0', textAlign: 'center',
                                        background: '#1C1917', color: '#fff',
                                        border: 'none', borderRadius: '9px',
                                        fontSize: '13px', fontWeight: '700',
                                        cursor: sendingEmail ? 'wait' : 'pointer',
                                        opacity: sendingEmail ? 0.55 : 1,
                                        whiteSpace: 'nowrap', flexShrink: 0,
                                        transition: 'opacity 0.2s'
                                    }}
                                >
                                    {sendingEmail ? 'Sending…' : 'Send →'}
                                </button>
                            </div>
                        </div>

                        {/* Divider */}
                        {sessionId && (
                            <>
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '12px',
                                    padding: '0 20px', marginBottom: '20px'
                                }}>
                                    <div style={{ flex: 1, height: '1px', background: '#EDECE8' }} />
                                    <span style={{ fontSize: '11px', color: '#C4C0BB', fontWeight: '600', whiteSpace: 'nowrap' }}>
                                        OR COPY LINK DIRECTLY
                                    </span>
                                    <div style={{ flex: 1, height: '1px', background: '#EDECE8' }} />
                                </div>

                                {/* Section: Copy Link */}
                                <div style={{ padding: '0 20px 20px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                        <div style={{
                                            width: '28px', height: '28px', borderRadius: '7px',
                                            background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            <Monitor size={14} color="#1D4ED8" />
                                        </div>
                                        <div>
                                            <p style={{ fontSize: '13px', fontWeight: '700', color: '#1C1917', margin: 0 }}>
                                                Continue on your PC
                                            </p>
                                            <p style={{ fontSize: '11px', color: '#A8A29E', margin: 0 }}>
                                                Secure link · expires in 7 days
                                            </p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <div style={{
                                            flex: 1, padding: '10px 14px', borderRadius: '9px',
                                            background: '#EFF6FF', border: '1.5px solid #BFDBFE',
                                            fontSize: '12px', color: '#1D4ED8',
                                            overflowX: 'auto', whiteSpace: 'nowrap',
                                            fontFamily: "'JetBrains Mono', monospace"
                                        }}>
                                            {window.location.origin}/session/{sessionId}
                                        </div>
                                        <button
                                            onClick={handleCopyLink}
                                            style={{
                                                padding: '10px 18px', flexShrink: 0,
                                                background: linkCopied ? '#1D4ED8' : '#fff',
                                                color: linkCopied ? '#fff' : '#1D4ED8',
                                                border: '1.5px solid #BFDBFE', borderRadius: '9px',
                                                fontSize: '13px', fontWeight: '700',
                                                cursor: 'pointer', transition: 'all 0.2s',
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
                                            {linkCopied ? '✓ Copied!' : 'Copy'}
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* ── Transcript Editor ── */}
                <div style={{ position: 'relative' }}>
                    <textarea
                        ref={textareaRef}
                        value={value}
                        onChange={handleChange}
                        onScroll={e => setShowScrollTop(e.target.scrollTop > 160)}
                        spellCheck={false}
                        style={{
                            display: 'block', width: '100%', height: '400px',
                            padding: '24px', border: 'none', outline: 'none',
                            fontFamily: "'EB Garamond', Georgia, serif",
                            fontSize: '16px', lineHeight: '1.95',
                            color: '#1C1917', background: '#fff',
                            resize: 'none', boxSizing: 'border-box',
                            overflowY: 'auto', WebkitOverflowScrolling: 'touch',
                            letterSpacing: '0.01em'
                        }}
                    />
                    {showScrollTop && (
                        <button onClick={scrollToTop} style={{
                            position: 'absolute', bottom: '14px', right: '14px',
                            width: '34px', height: '34px',
                            background: 'rgba(28,25,23,0.7)', border: 'none', borderRadius: '50%',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            backdropFilter: 'blur(6px)', animation: 'fadeIn 0.2s ease'
                        }}>
                            <ChevronUp size={16} color="white" />
                        </button>
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    padding: '9px 16px', borderTop: '1px solid #F5F4F0',
                    background: '#FAFAF9', display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <span style={{ fontSize: '11px', color: '#C4C0BB', fontStyle: 'italic' }}>
                        Tap to edit · changes are local to this device
                    </span>
                    <span style={{ fontSize: '11px', color: '#D6D3CE', fontWeight: '600', letterSpacing: '0.05em' }}>INKTO</span>
                </div>
            </div>

            {/* ── New Document Button ── */}
            <button onClick={onReset} style={{
                width: '100%', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: '8px', padding: '14px',
                background: '#FAFAF9', border: '1px solid #E4E2DC', borderRadius: '12px',
                fontSize: '13px', fontWeight: '600', color: '#78716C',
                cursor: 'pointer', transition: 'all 0.2s',
                letterSpacing: '0.01em'
            }}
                onMouseEnter={e => { e.currentTarget.style.background = '#F5F4F0'; e.currentTarget.style.borderColor = '#C4C0BB'; e.currentTarget.style.color = '#44403C'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#FAFAF9'; e.currentTarget.style.borderColor = '#E4E2DC'; e.currentTarget.style.color = '#78716C'; }}
            >
                <RotateCcw size={13} /> Start New Document
            </button>
        </div>
    );
}

function SmallBtn({ icon, label, onClick, accent }) {
    return (
        <button onClick={onClick} style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            padding: '6px 12px',
            background: accent ? '#EFF6FF' : '#F5F4F0',
            border: 'none', borderRadius: '7px',
            fontSize: '12px', fontWeight: '600',
            color: accent ? '#1D4ED8' : '#44403C',
            cursor: 'pointer', transition: 'background 0.15s',
            whiteSpace: 'nowrap'
        }}
            onMouseEnter={e => e.currentTarget.style.background = accent ? '#DBEAFE' : '#EDECE8'}
            onMouseLeave={e => e.currentTarget.style.background = accent ? '#EFF6FF' : '#F5F4F0'}
        >
            {icon} {label}
        </button>
    );
}
