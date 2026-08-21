import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Copy, Check, RotateCcw, FileText, FileDown, ChevronUp, Mail } from 'lucide-react';

export default function OutputBox({ text, sessionId, images = [], onReset }) {
    const [value, setValue] = useState(text);
    const [copied, setCopied] = useState(false);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

    const [email, setEmail] = useState(() => localStorage.getItem('inkto_last_email') || '');
    const [sendingEmail, setSendingEmail] = useState(false);
    const [emailStatus, setEmailStatus] = useState(null);
    const [emailFocused, setEmailFocused] = useState(false);

    const textareaRef = useRef(null);
    const debounceTimer = useRef(null);
    const [deferredValue, setDeferredValue] = useState(text);

    useEffect(() => {
        const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleChange = useCallback((e) => {
        const v = e.target.value;
        setValue(v);
        clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => setDeferredValue(v), 300);
    }, []);

    useEffect(() => () => clearTimeout(debounceTimer.current), []);

    const stats = useMemo(() => {
        const words = deferredValue.trim().split(/\s+/).filter(Boolean).length;
        return { words };
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
            a.href = url;
            a.download = `transcript-${new Date().toISOString().slice(0, 10)}.docx`;
            a.click(); URL.revokeObjectURL(url);
        } catch { alert('Could not generate Word document. Try .txt instead.'); }
    };

    const handleSendEmail = async () => {
        if (!email || !email.includes('@')) {
            setEmailStatus({ type: 'error', msg: 'Enter a valid email.' });
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
            if (!res.ok) throw new Error(data.error || 'Failed to send');
            setEmailStatus({ type: 'success', msg: 'Sent! Check your inbox.' });
        } catch (err) {
            setEmailStatus({ type: 'error', msg: err.message });
        } finally { setSendingEmail(false); }
    };

    const handleSaveHistory = async () => {
        if (!email || !email.includes('@')) {
            setEmailStatus({ type: 'error', msg: 'Enter a valid email.' });
            return;
        }
        setSendingEmail(true);
        setEmailStatus(null);
        localStorage.setItem('inkto_last_email', email);
        try {
            const res = await fetch('/api/save-history', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, sessionId })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to save');
            setEmailStatus({ type: 'success', msg: 'Saved to history!' });
        } catch (err) {
            setEmailStatus({ type: 'error', msg: err.message });
        } finally { setSendingEmail(false); }
    };

    const scrollToTop = () => textareaRef.current?.scrollTo({ top: 0, behavior: 'smooth' });

    const emailRow = (
        <div style={{
            background: '#fff', border: '1px solid #E4E2DC',
            borderRadius: '12px', padding: '14px 16px',
            marginBottom: '10px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
        }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{
                    flex: '1 1 200px',
                    border: `1.5px solid ${emailFocused ? '#1D4ED8' : '#E4E2DC'}`,
                    borderRadius: '8px', background: '#FAFAF9',
                    transition: 'border-color 0.2s',
                    boxShadow: emailFocused ? '0 0 0 3px rgba(29,78,216,0.08)' : 'none',
                    display: 'flex', alignItems: 'center', padding: '0 12px'
                }}>
                    <Mail size={15} color="#A8A29E" style={{ flexShrink: 0 }} />
                    <input
                        type="email"
                        placeholder="Email address"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        onFocus={() => setEmailFocused(true)}
                        onBlur={() => setEmailFocused(false)}
                        style={{
                            flex: 1, padding: '9px 10px',
                            border: 'none', outline: 'none',
                            fontSize: '14px', fontFamily: 'inherit',
                            background: 'transparent', color: '#1C1917',
                        }}
                    />
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                        onClick={handleSendEmail}
                        disabled={sendingEmail}
                        title="Send transcript via email"
                        style={{
                            padding: '9px 14px', textAlign: 'center',
                            background: '#F5F4F0', color: '#1C1917',
                            border: '1px solid #E4E2DC', borderRadius: '8px',
                            fontSize: '13px', fontWeight: '600',
                            cursor: sendingEmail ? 'wait' : 'pointer',
                            opacity: sendingEmail ? 0.5 : 1,
                            transition: 'all 0.2s', whiteSpace: 'nowrap'
                        }}
                    >
                        Inbox
                    </button>
                    <button
                        onClick={handleSaveHistory}
                        disabled={sendingEmail}
                        title="Save to your history (no email sent)"
                        style={{
                            padding: '9px 14px', textAlign: 'center',
                            background: '#1C1917', color: '#fff',
                            border: 'none', borderRadius: '8px',
                            fontSize: '13px', fontWeight: '700',
                            cursor: sendingEmail ? 'wait' : 'pointer',
                            opacity: sendingEmail ? 0.5 : 1,
                            transition: 'opacity 0.2s', whiteSpace: 'nowrap'
                        }}
                    >
                        Save
                    </button>
                </div>
            </div>
            {emailStatus && (
                <p style={{
                    margin: '8px 0 0 4px', fontSize: '12px', fontWeight: '600',
                    color: emailStatus.type === 'success' ? '#15803D' : '#B91C1C'
                }}>{emailStatus.msg}</p>
            )}
        </div>
    );

    const toolbar = (
        <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 14px', borderBottom: '1px solid #F0EFEB',
            background: '#FAFAF9'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={13} color="#C4C0BB" />
                <span style={{ fontSize: '12px', color: '#A8A29E', fontWeight: '600' }}>Transcript</span>
                <span style={{
                    fontSize: '10px', background: '#F0EFEB', color: '#78716C',
                    padding: '2px 7px', borderRadius: '99px', fontWeight: '600'
                }}>Editable</span>
            </div>
            <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                <ActionBtn icon={<FileDown size={12} color="#1D4ED8" />} label={isDesktop ? "Open in Word" : ".docx"} onClick={handleDownloadDocx} accent />
                <button onClick={handleCopy} style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    padding: '6px 13px', flexShrink: 0,
                    background: copied ? '#DCFCE7' : '#1C1917',
                    color: copied ? '#15803D' : '#fff',
                    border: 'none', borderRadius: '7px',
                    fontSize: '12px', fontWeight: '700',
                    cursor: 'pointer', transition: 'all 0.2s',
                    whiteSpace: 'nowrap'
                }}>
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    {copied ? 'Copied!' : 'Copy'}
                </button>
            </div>
        </div>
    );

    if (isDesktop) {
        return (
            <div style={{ animation: 'fadeIn 0.4s ease' }} className="desktop-split">
                
                {/* Left Pane - Source Images */}
                {images.length > 0 && (
                    <div className="left-pane" style={{
                        background: '#FAFAF9', borderRight: '1px solid #E4E2DC',
                        overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px'
                    }}>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#78716C', marginBottom: '-8px' }}>
                            Source Documents
                        </div>
                        {images.map((img, i) => (
                            <div key={i} style={{
                                background: '#fff', border: '1px solid #E4E2DC', borderRadius: '12px',
                                overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                            }}>
                                <img src={img} alt={`Page ${i+1}`} style={{ width: '100%', display: 'block' }} />
                                <div style={{ padding: '8px 12px', background: '#FAFAF9', borderTop: '1px solid #F0EFEB', fontSize: '11px', color: '#A8A29E', fontWeight: '600', textAlign: 'center' }}>
                                    Page {i+1}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Right Pane - Editor */}
                <div className="right-pane" style={{ padding: '24px', overflowY: 'auto' }}>
                    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px'
                        }}>
                            <div style={{
                                width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
                                background: '#15803D', color: '#fff',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '12px', fontWeight: '800'
                            }}>✓</div>
                            <span style={{ fontSize: '13px', fontWeight: '700', color: '#44403C' }}>
                                Transcription complete
                            </span>
                            <div style={{ flex: 1, height: '1px', background: '#E4E2DC' }} />
                            <span style={{ fontSize: '11px', color: '#A8A29E', whiteSpace: 'nowrap' }}>
                                {stats.words.toLocaleString()} words
                            </span>
                        </div>

                        {emailRow}

                        <div style={{
                            background: '#fff', border: '1px solid #E4E2DC',
                            borderRadius: '16px', overflow: 'hidden',
                            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                            marginBottom: '10px'
                        }}>
                            {toolbar}
                            
                            <div style={{ position: 'relative' }}>
                                <textarea
                                    ref={textareaRef}
                                    value={value}
                                    onChange={handleChange}
                                    onScroll={e => setShowScrollTop(e.target.scrollTop > 160)}
                                    spellCheck={false}
                                    style={{
                                        display: 'block', width: '100%', minHeight: '60vh',
                                        padding: '40px 48px', border: 'none', outline: 'none',
                                        fontFamily: "'EB Garamond', Georgia, serif",
                                        fontSize: '18px', lineHeight: '2.1', // Larger for desktop
                                        color: '#1C1917', background: '#fff',
                                        resize: 'vertical', boxSizing: 'border-box',
                                    }}
                                />
                                {showScrollTop && (
                                    <button onClick={scrollToTop} style={{
                                        position: 'absolute', bottom: '16px', right: '16px',
                                        width: '36px', height: '36px',
                                        background: 'rgba(28,25,23,0.65)', border: 'none', borderRadius: '50%',
                                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        backdropFilter: 'blur(4px)', animation: 'fadeIn 0.2s ease'
                                    }}>
                                        <ChevronUp size={16} color="white" />
                                    </button>
                                )}
                            </div>
                        </div>

                        <button onClick={onReset} style={{
                            width: '100%', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', gap: '8px', padding: '13px',
                            background: '#FAFAF9', border: '1px solid #E4E2DC', borderRadius: '10px',
                            fontSize: '13px', fontWeight: '600', color: '#78716C',
                            cursor: 'pointer', transition: 'all 0.2s'
                        }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#F0EFEB'; e.currentTarget.style.color = '#44403C'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#FAFAF9'; e.currentTarget.style.color = '#78716C'; }}
                        >
                            <RotateCcw size={13} /> New document
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ animation: 'fadeIn 0.4s ease' }}>
            {/* Status row */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px'
            }}>
                <div style={{
                    width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
                    background: '#15803D', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '12px', fontWeight: '800'
                }}>✓</div>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#44403C' }}>
                    Transcription complete
                </span>
                <div style={{ flex: 1, height: '1px', background: '#E4E2DC' }} />
                <span style={{ fontSize: '11px', color: '#A8A29E', whiteSpace: 'nowrap' }}>
                    {stats.words.toLocaleString()} words
                </span>
            </div>

            {emailRow}

            <div style={{
                background: '#fff', border: '1px solid #E4E2DC',
                borderRadius: '16px', overflow: 'hidden',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                marginBottom: '10px'
            }}>
                {toolbar}

                <div style={{ position: 'relative' }}>
                    <textarea
                        ref={textareaRef}
                        value={value}
                        onChange={handleChange}
                        onScroll={e => setShowScrollTop(e.target.scrollTop > 160)}
                        spellCheck={false}
                        style={{
                            display: 'block', width: '100%', height: '380px',
                            padding: '22px', border: 'none', outline: 'none',
                            fontFamily: "'EB Garamond', Georgia, serif",
                            fontSize: '16px', lineHeight: '1.9',
                            color: '#1C1917', background: '#fff',
                            resize: 'none', boxSizing: 'border-box',
                            overflowY: 'auto', WebkitOverflowScrolling: 'touch',
                        }}
                    />
                    {showScrollTop && (
                        <button onClick={scrollToTop} style={{
                            position: 'absolute', bottom: '12px', right: '12px',
                            width: '32px', height: '32px',
                            background: 'rgba(28,25,23,0.65)', border: 'none', borderRadius: '50%',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            backdropFilter: 'blur(4px)', animation: 'fadeIn 0.2s ease'
                        }}>
                            <ChevronUp size={15} color="white" />
                        </button>
                    )}
                </div>
            </div>

            <button onClick={onReset} style={{
                width: '100%', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: '8px', padding: '13px',
                background: '#FAFAF9', border: '1px solid #E4E2DC', borderRadius: '10px',
                fontSize: '13px', fontWeight: '600', color: '#78716C',
                cursor: 'pointer', transition: 'all 0.2s'
            }}
                onMouseEnter={e => { e.currentTarget.style.background = '#F0EFEB'; e.currentTarget.style.color = '#44403C'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#FAFAF9'; e.currentTarget.style.color = '#78716C'; }}
            >
                <RotateCcw size={13} /> New document
            </button>
        </div>
    );
}

function ActionBtn({ icon, label, onClick, accent }) {
    return (
        <button onClick={onClick} style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            padding: '6px 12px',
            background: accent ? '#EFF6FF' : '#F5F4F0',
            border: 'none', borderRadius: '7px',
            fontSize: '12px', fontWeight: '600',
            color: accent ? '#1D4ED8' : '#57534E',
            cursor: 'pointer', whiteSpace: 'nowrap'
        }}>
            {icon} {label}
        </button>
    );
}
