import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Copy, Check, RotateCcw, FileText, FileDown, ChevronUp, Mail, Pen } from 'lucide-react';

const IconCoffee = ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" y1="2" x2="6" y2="4"/><line x1="10" y1="2" x2="10" y2="4"/><line x1="14" y1="2" x2="14" y2="4"/></svg>
);

const SourceDocument = ({ url, index }) => {
    const [error, setError] = useState(false);
    const isPdf = url.includes('.pdf');

    if (error || isPdf) {
        return (
            <div style={{
                background: '#fff', border: '1px solid #E4E2DC', borderRadius: '12px',
                padding: '32px 24px', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
            }}>
                <div style={{
                    width: '48px', height: '48px', borderRadius: '12px',
                    background: '#F3F4F6', display: 'flex', alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <FileText size={24} color="#9CA3AF" />
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#4B5563' }}>
                        {isPdf ? 'PDF Document' : 'Document Unavailable'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '4px' }}>
                        Page {index}
                    </div>
                </div>
                {!error && isPdf && (
                    <a href={url} target="_blank" rel="noopener noreferrer" style={{
                        marginTop: '8px', fontSize: '12px', fontWeight: '600', color: '#2563EB', textDecoration: 'none',
                        padding: '6px 12px', background: '#EFF6FF', borderRadius: '6px'
                    }}>
                        View PDF
                    </a>
                )}
            </div>
        );
    }

    return (
        <div style={{
            background: '#fff', border: '1px solid #E4E2DC', borderRadius: '12px',
            overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            display: 'flex', flexDirection: 'column'
        }}>
            <div style={{
                background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '24px'
            }}>
                <img 
                    src={url} 
                    alt={`Page ${index}`} 
                    onError={() => setError(true)}
                    style={{ 
                        maxWidth: '100%', maxHeight: '50vh', 
                        objectFit: 'contain', 
                        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                        borderRadius: '4px'
                    }} 
                />
            </div>
            <div style={{ 
                padding: '12px', background: '#fff', borderTop: '1px solid #F0EFEB', 
                fontSize: '12px', color: '#6B7280', fontWeight: '600', textAlign: 'center' 
            }}>
                Page {index}
            </div>
        </div>
    );
};

export default function OutputBox({ text, sessionId, images = [], onReset }) {
    const [value, setValue] = useState(text);
    const [copied, setCopied] = useState(false);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
    const [isEditing, setIsEditing] = useState(false);

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
                            background: '#2563EB', color: '#fff',
                            border: 'none', borderRadius: '8px',
                            fontSize: '13px', fontWeight: '700',
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
            </div>
            <div style={{ display: 'flex', gap: '6px', flexShrink: 0, alignItems: 'center' }}>
                {isEditing ? (
                    <button onClick={() => setIsEditing(false)} style={{
                        display: 'flex', alignItems: 'center', gap: '5px',
                        padding: '6px 12px',
                        background: '#FEF2F2', border: 'none', borderRadius: '7px',
                        fontSize: '12px', fontWeight: '600', color: '#B91C1C',
                        cursor: 'pointer', whiteSpace: 'nowrap'
                    }}>
                        Done editing
                    </button>
                ) : (
                    <button
                        onClick={() => { setIsEditing(true); setTimeout(() => textareaRef.current?.focus(), 50); }}
                        title="Edit transcript"
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: '30px', height: '30px',
                            background: '#F5F4F0', border: 'none', borderRadius: '7px',
                            cursor: 'pointer',
                        }}
                    >
                        <Pen size={12} color="#57534E" />
                    </button>
                )}
                <ActionBtn icon={<FileDown size={12} color="#1D4ED8" />} label={isDesktop ? "Open in Word" : ".docx"} onClick={handleDownloadDocx} accent />
                <button onClick={handleCopy} title={copied ? 'Copied!' : 'Copy'} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: '32px', height: '32px', flexShrink: 0,
                    background: copied ? '#DCFCE7' : '#1C1917',
                    color: copied ? '#15803D' : '#fff',
                    border: 'none', borderRadius: '7px',
                    cursor: 'pointer', transition: 'all 0.2s',
                }}>
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
            </div>
        </div>
    );

    const tipBanner = (
        <div style={{
            marginTop: '8px', marginBottom: '14px', background: '#FFFBEB', border: '1px solid #FEF3C7',
            borderRadius: '10px', padding: '16px', textAlign: 'center',
            boxShadow: '0 2px 8px rgba(245,158,11,0.08)'
        }}>
            <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#92400E', lineHeight: '1.5', fontWeight: '500' }}>
                Did Inkto save you time? Consider buying the creator a coffee to keep the servers running.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <a href="https://paystack.shop/pay/4h04eqpye7" target="_blank" rel="noopener noreferrer" style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    background: '#10B981', color: '#fff', textDecoration: 'none',
                    padding: '9px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: '700',
                    boxShadow: '0 2px 8px rgba(16,185,129,0.3)', transition: 'all 0.2s'
                }}>
                    <IconCoffee size={15} /> Tip (NGN)
                </a>
                <a href="https://paypal.me/frankyideal25" target="_blank" rel="noopener noreferrer" style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    background: '#F59E0B', color: '#fff', textDecoration: 'none',
                    padding: '9px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: '700',
                    boxShadow: '0 2px 8px rgba(245,158,11,0.3)', transition: 'all 0.2s'
                }}>
                    <IconCoffee size={15} /> Tip (USD)
                </a>
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
                            <SourceDocument key={i} url={img} index={i + 1} />
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
                            <div style={{ padding: '10px 14px 0', borderTop: '1px solid #F0EFEB' }}>
                        </div>
                            
                            <div style={{ position: 'relative' }}>
                                <textarea
                                    ref={textareaRef}
                                    value={value}
                                    onChange={handleChange}
                                    onScroll={e => setShowScrollTop(e.target.scrollTop > 160)}
                                    spellCheck={false}
                                    readOnly={!isEditing}
                                    onClick={() => {
                                        if (!isEditing) {
                                            setIsEditing(true);
                                            setTimeout(() => textareaRef.current?.focus(), 50);
                                        }
                                    }}
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

                        {tipBanner}

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
                <div style={{ padding: '8px 12px 0', borderTop: '1px solid #F0EFEB' }}>
                </div>

                <div style={{ position: 'relative' }}>
                    <textarea
                        ref={textareaRef}
                        value={value}
                        onChange={handleChange}
                        onScroll={e => setShowScrollTop(e.target.scrollTop > 160)}
                        spellCheck={false}
                        readOnly={!isEditing}
                        onClick={() => {
                            if (!isEditing) {
                                setIsEditing(true);
                                setTimeout(() => textareaRef.current?.focus(), 50);
                            }
                        }}
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

            {tipBanner}

            <button onClick={onReset} style={{
                width: '100%', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: '8px', padding: '13px',
                background: '#FAFAF9', border: '1px solid #E4E2DC', borderRadius: '10px',
                fontSize: '13px', fontWeight: '600', color: '#78716C',
                cursor: 'pointer', transition: 'all 0.2s', marginBottom: '32px'
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
