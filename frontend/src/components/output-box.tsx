/* eslint-disable */
// @ts-nocheck
'use client';
import dynamic from 'next/dynamic';
const RichEditor = dynamic(() => import('./rich-editor'), { ssr: false });
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Copy, Check, RotateCcw, FileText, FileDown, ChevronUp, Mail, Pen, X, File, Image as ImageIcon } from 'lucide-react';

/* â”€â”€ Inline SVGs â”€â”€ */
const IconPaystack = ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M4 17h6v4H4v-4zM14 17h6v4h-6v-4zM4 10h6v4H4v-4zM14 10h6v4h-6v-4zM4 3h6v4H4V3z" /></svg>
);
const IconPayPal = ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M7.077 16.26l1.3-8.24c.1-.64.65-1.12 1.3-1.12h4.55c2.4 0 3.9 1.15 3.9 3.4 0 2.44-1.5 4.38-4 4.38h-2.02c-.52 0-.96.38-1.04.9l-.6 3.75c-.04.25-.26.43-.51.43H7.43c-.35 0-.6-.33-.53-.66l.17-.84z" />
        <path fillOpacity="0.5" d="M10.77 8.26l-1.3 8.24c-.1.64-.65 1.12-1.3 1.12H5.63c-.35 0-.6.33-.53.66l1.7-10.84c.1-.64.65-1.12 1.3-1.12h4.55c1.47 0 2.57.43 3.24 1.16-.48-.7-1.33-1.16-2.52-1.16H8.82c-.65 0-1.2.48-1.3 1.12L6.22 15.26h2.52c.52 0 .96-.38 1.04-.9l.99-6.1z" />
    </svg>
);

/* â”€â”€ Source document filmstrip viewer â”€â”€ */
const FilmstripViewer = ({ images }) => {
    const [selected, setSelected] = useState(0);
    const [imgError, setImgError] = useState({});
    const isPdf = images[selected]?.includes('.pdf') || imgError[selected];

    return (
        <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
            {/* Thumbnail strip */}
            <div style={{
                width: '80px', flexShrink: 0,
                overflowY: 'auto', borderRight: '1px solid #E4E2DC',
                background: '#F5F4F0', display: 'flex', flexDirection: 'column',
                gap: '6px', padding: '10px 6px',
            }}>
                {images.map((url, i) => (
                    <button
                        key={i}
                        onClick={() => setSelected(i)}
                        style={{
                            width: '68px', height: '88px', flexShrink: 0,
                            border: i === selected ? '2px solid #1D4ED8' : '2px solid transparent',
                            borderRadius: '8px', overflow: 'hidden',
                            cursor: 'pointer', padding: 0, background: '#fff',
                            boxShadow: i === selected ? '0 0 0 2px rgba(29,78,216,0.15)' : '0 1px 3px rgba(0,0,0,0.08)',
                            transition: 'border-color 0.15s, box-shadow 0.15s',
                            position: 'relative',
                        }}
                    >
                        {url.includes('.pdf') || imgError[i] ? (
                            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '3px', background: '#EFF6FF' }}>
                                <FileText size={18} color="#2563EB" />
                                <span style={{ fontSize: '8px', fontWeight: '700', color: '#3B82F6' }}>PDF</span>
                            </div>
                        ) : (
                            <img src={url} alt={`p.${i+1}`}
                                onError={() => setImgError(prev => ({ ...prev, [i]: true }))}
                                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        )}
                        <div style={{
                            position: 'absolute', bottom: '3px', left: '50%', transform: 'translateX(-50%)',
                            background: 'rgba(0,0,0,0.55)', color: '#fff',
                            fontSize: '8px', fontWeight: '700',
                            padding: '1px 5px', borderRadius: '4px',
                            backdropFilter: 'blur(4px)', whiteSpace: 'nowrap'
                        }}>{i + 1}</div>
                    </button>
                ))}
            </div>

            {/* Main preview */}
            <div style={{
                flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column',
                background: '#FAFAF9',
            }}>
                <div style={{
                    padding: '10px 14px', borderBottom: '1px solid #E4E2DC',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: '#fff',
                }}>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#44403C' }}>
                        Page {selected + 1} of {images.length}
                    </span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                            disabled={selected === 0}
                            onClick={() => setSelected(s => Math.max(0, s - 1))}
                            style={{
                                width: '28px', height: '28px', border: '1px solid #E4E2DC',
                                borderRadius: '6px', background: '#fff', cursor: selected === 0 ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                opacity: selected === 0 ? 0.4 : 1, transition: 'opacity 0.15s'
                            }}
                        >
                            <svg width="10" height="10" viewBox="0 0 10 10"><path d="M7 1L3 5L7 9" stroke="#44403C" strokeWidth="1.5" strokeLinecap="round" fill="none"/></svg>
                        </button>
                        <button
                            disabled={selected === images.length - 1}
                            onClick={() => setSelected(s => Math.min(images.length - 1, s + 1))}
                            style={{
                                width: '28px', height: '28px', border: '1px solid #E4E2DC',
                                borderRadius: '6px', background: '#fff', cursor: selected === images.length - 1 ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                opacity: selected === images.length - 1 ? 0.4 : 1, transition: 'opacity 0.15s'
                            }}
                        >
                            <svg width="10" height="10" viewBox="0 0 10 10"><path d="M3 1L7 5L3 9" stroke="#44403C" strokeWidth="1.5" strokeLinecap="round" fill="none"/></svg>
                        </button>
                    </div>
                </div>

                <div style={{
                    flex: 1, overflowY: 'auto', display: 'flex',
                    alignItems: 'flex-start', justifyContent: 'center',
                    padding: '20px',
                }}>
                    {isPdf ? (
                        <div style={{
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center',
                            gap: '12px', padding: '48px', textAlign: 'center',
                            background: '#fff', borderRadius: '12px',
                            border: '1px solid #E4E2DC', width: '100%',
                        }}>
                            <FileText size={40} color="#9CA3AF" />
                            <div style={{ fontSize: '14px', fontWeight: '600', color: '#4B5563' }}>PDF Document</div>
                            <div style={{ fontSize: '12px', color: '#9CA3AF' }}>Page {selected + 1}</div>
                        </div>
                    ) : (
                        <img
                            src={images[selected]}
                            alt={`Page ${selected + 1}`}
                            onError={() => setImgError(prev => ({ ...prev, [selected]: true }))}
                            style={{
                                maxWidth: '100%', borderRadius: '8px',
                                boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
                                display: 'block',
                            }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};


/* â”€â”€ Format picker modal for Inbox â”€â”€ */
function InboxModal({ onClose, onSend }) {
    const [selected, setSelected] = useState({ docx: true, pdf: false });

    const toggle = (fmt) => setSelected(prev => ({ ...prev, [fmt]: !prev[fmt] }));
    const canSend = selected.docx || selected.pdf;

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={onClose}
                style={{
                    position: 'fixed', inset: 0, zIndex: 200,
                    background: 'rgba(0,0,0,0.45)',
                    backdropFilter: 'blur(4px)',
                    animation: 'fadeIn 0.2s ease',
                }}
            />
            {/* Sheet */}
            <div style={{
                position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 201,
                background: '#fff', borderRadius: '20px 20px 0 0',
                padding: '28px 24px 40px',
                boxShadow: '0 -8px 48px rgba(0,0,0,0.18)',
                animation: 'slideUp 0.28s cubic-bezier(0.4,0,0.2,1)',
                maxWidth: '520px', margin: '0 auto',
            }}>
                <style>{`
                    @keyframes slideUp {
                        from { transform: translateY(100%); opacity: 0; }
                        to   { transform: translateY(0);    opacity: 1; }
                    }
                `}</style>

                {/* Handle */}
                <div style={{ width: '40px', height: '4px', background: '#E4E2DC', borderRadius: '99px', margin: '0 auto 24px' }} />

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1C1917', margin: 0, letterSpacing: '-0.3px' }}>
                        Choose attachment format
                    </h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#A8A29E' }}>
                        <X size={20} />
                    </button>
                </div>
                <p style={{ fontSize: '13px', color: '#78716C', marginBottom: '24px', lineHeight: 1.6 }}>
                    Select which formats to attach to the email. The secure session link is always included.
                </p>

                {/* Options */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                    {[
                        { key: 'docx', label: 'Word Document', sub: 'Editable .docx file', color: '#2563EB', bg: '#EFF6FF' },
                        { key: 'pdf', label: 'PDF Document', sub: 'Print-ready .pdf file', color: '#DC2626', bg: '#FEF2F2' },
                    ].map(({ key, label, sub, color, bg }) => {
                        const active = selected[key];
                        return (
                            <button
                                key={key}
                                onClick={() => toggle(key)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '14px',
                                    padding: '16px 18px', borderRadius: '14px', cursor: 'pointer',
                                    border: `2px solid ${active ? color : '#E4E2DC'}`,
                                    background: active ? bg : '#FAFAF9',
                                    transition: 'all 0.18s ease',
                                    textAlign: 'left', width: '100%', fontFamily: 'inherit',
                                }}
                            >
                                <div style={{
                                    width: '40px', height: '40px', borderRadius: '10px',
                                    background: active ? color : '#E4E2DC',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0, transition: 'all 0.18s',
                                }}>
                                    <File size={18} color="#fff" />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '14px', fontWeight: '700', color: active ? color : '#44403C' }}>{label}</div>
                                    <div style={{ fontSize: '12px', color: '#78716C', marginTop: '2px' }}>{sub}</div>
                                </div>
                                <div style={{
                                    width: '22px', height: '22px', borderRadius: '50%',
                                    border: `2px solid ${active ? color : '#C4C0BB'}`,
                                    background: active ? color : 'transparent',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0, transition: 'all 0.18s',
                                }}>
                                    {active && <Check size={12} color="#fff" strokeWidth={3} />}
                                </div>
                            </button>
                        );
                    })}
                </div>

                <button
                    onClick={() => { if (canSend) { onSend(selected); onClose(); } }}
                    disabled={!canSend}
                    style={{
                        width: '100%', padding: '15px',
                        background: canSend ? '#1C1917' : '#E4E2DC',
                        color: canSend ? '#fff' : '#A8A29E',
                        border: 'none', borderRadius: '12px',
                        fontSize: '15px', fontWeight: '800',
                        cursor: canSend ? 'pointer' : 'not-allowed',
                        transition: 'all 0.18s', fontFamily: 'inherit',
                        letterSpacing: '-0.1px',
                    }}
                >
                    Send to inbox
                </button>
            </div>
        </>
    );
}

/* â”€â”€ Download helper (works on mobile too) â”€â”€ */
async function downloadFile(endpoint, text, filename, fallbackMsg) {
    try {
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text }),
        });
        if (!res.ok) {
            const ct = res.headers.get('content-type') || '';
            const msg = ct.includes('json')
                ? (await res.json()).error
                : await res.text();
            throw new Error(msg || fallbackMsg);
        }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (err) {
        alert(err.message || fallbackMsg);
    }
}

/* â”€â”€ Main component â”€â”€ */
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
    const [showInboxModal, setShowInboxModal] = useState(false);

    const textareaRef = useRef(null);
    const debounceTimer = useRef(null);
    const [deferredValue, setDeferredValue] = useState(text);

    const isNoText = value.startsWith('[No handwritten text found');

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

    const handleDownloadDocx = () => {
        const date = new Date().toISOString().slice(0, 10);
        downloadFile('/api/download-docx', value, `inkto-transcript-${date}.docx`, 'Could not generate Word document.');
    };

    const handleDownloadPdf = () => {
        const date = new Date().toISOString().slice(0, 10);
        downloadFile('/api/download-pdf', value, `inkto-transcript-${date}.pdf`, 'Could not generate PDF.');
    };

    /* Validate email client-side without browser pattern issues */
    const validateEmail = (e) => e && e.includes('@') && e.includes('.');

    const handleSendEmail = async (formats = { docx: true, pdf: false }) => {
        if (!validateEmail(email)) {
            setEmailStatus({ type: 'error', msg: 'Enter a valid email address.' });
            return;
        }
        setSendingEmail(true);
        setEmailStatus(null);
        localStorage.setItem('inkto_last_email', email);
        try {
            const res = await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: value, recipientEmail: email, sessionId, formats }),
            });
            // Always try to parse JSON; if not JSON, extract text
            const ct = res.headers.get('content-type') || '';
            const data = ct.includes('json') ? await res.json() : { error: await res.text() };
            if (!res.ok) throw new Error(data.error || 'Failed to send.');
            setEmailStatus({ type: 'success', msg: 'Sent! Check your inbox.' });
        } catch (err) {
            setEmailStatus({ type: 'error', msg: err.message });
        } finally { setSendingEmail(false); }
    };

    const handleSaveHistory = async () => {
        if (!validateEmail(email)) {
            setEmailStatus({ type: 'error', msg: 'Enter a valid email address.' });
            return;
        }
        setSendingEmail(true);
        setEmailStatus(null);
        localStorage.setItem('inkto_last_email', email);
        try {
            const res = await fetch('/api/save-history', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, sessionId }),
            });
            const ct = res.headers.get('content-type') || '';
            const data = ct.includes('json') ? await res.json() : { error: await res.text() };
            if (!res.ok) throw new Error(data.error || 'Failed to save.');
            setEmailStatus({ type: 'success', msg: 'Saved to history!' });
        } catch (err) {
            setEmailStatus({ type: 'error', msg: err.message });
        } finally { setSendingEmail(false); }
    };

    const scrollToTop = () => textareaRef.current?.scrollTo({ top: 0, behavior: 'smooth' });

    /* â”€â”€ Email row â”€â”€ */
    const emailRow = (
        <div style={{
            background: '#fff', border: '1px solid #E4E2DC',
            borderRadius: '12px', padding: '14px 16px',
            marginBottom: '10px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{
                    flex: '1 1 180px', minWidth: 0,
                    border: `1.5px solid ${emailFocused ? '#1D4ED8' : '#E4E2DC'}`,
                    borderRadius: '8px', background: '#FAFAF9',
                    transition: 'border-color 0.2s',
                    boxShadow: emailFocused ? '0 0 0 3px rgba(29,78,216,0.08)' : 'none',
                    display: 'flex', alignItems: 'center', padding: '0 10px',
                }}>
                    <Mail size={14} color="#A8A29E" style={{ flexShrink: 0 }} />
                    <input
                        /* Use type="text" to avoid browser's native pattern validation popup */
                        type="text"
                        inputMode="email"
                        autoComplete="email"
                        placeholder="Email address"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        onFocus={() => setEmailFocused(true)}
                        onBlur={() => setEmailFocused(false)}
                        style={{
                            flex: 1, padding: '9px 8px', minWidth: 0,
                            border: 'none', outline: 'none',
                            fontSize: '14px', fontFamily: 'inherit',
                            background: 'transparent', color: '#1C1917',
                        }}
                    />
                </div>
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <button
                        onClick={() => {
                            if (!validateEmail(email)) {
                                setEmailStatus({ type: 'error', msg: 'Enter a valid email address.' });
                                return;
                            }
                            setShowInboxModal(true);
                        }}
                        disabled={sendingEmail}
                        style={{
                            padding: '9px 14px',
                            background: '#2563EB', color: '#fff',
                            border: 'none', borderRadius: '8px',
                            fontSize: '13px', fontWeight: '700',
                            cursor: sendingEmail ? 'wait' : 'pointer',
                            opacity: sendingEmail ? 0.5 : 1,
                            whiteSpace: 'nowrap', fontFamily: 'inherit',
                        }}
                    >
                        Email transcript
                    </button>
                    <button
                        onClick={handleSaveHistory}
                        disabled={sendingEmail}
                        style={{
                            padding: '9px 14px',
                            background: '#1C1917', color: '#fff',
                            border: 'none', borderRadius: '8px',
                            fontSize: '13px', fontWeight: '700',
                            cursor: sendingEmail ? 'wait' : 'pointer',
                            opacity: sendingEmail ? 0.5 : 1,
                            whiteSpace: 'nowrap', fontFamily: 'inherit',
                        }}
                    >
                        Save to history
                    </button>
                </div>
            </div>
            {emailStatus && (
                <p style={{ margin: '8px 0 0 2px', fontSize: '12px', fontWeight: '600', color: emailStatus.type === 'success' ? '#15803D' : '#B91C1C', wordBreak: 'break-word', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical' }}>
                    {emailStatus.msg}
                </p>
            )}
        </div>
    );

    /* â”€â”€ Toolbar â”€â”€ */
    const toolbar = (
        <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 14px', borderBottom: '1px solid #F0EFEB',
            background: '#FAFAF9', flexWrap: 'nowrap', gap: '6px',
            overflowX: 'auto',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                <FileText size={13} color="#C4C0BB" />
                <span style={{ fontSize: '12px', color: '#A8A29E', fontWeight: '600', whiteSpace: 'nowrap' }}>Transcript</span>
            </div>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
                {/* Edit / Done */}
                {isEditing ? (
                    <button onClick={() => setIsEditing(false)} title="Done editing" style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: isDesktop ? '5px' : '0',
                        width: isDesktop ? 'auto' : '30px', height: '30px',
                        padding: isDesktop ? '6px 12px' : '0', background: '#FEF2F2', border: 'none', borderRadius: '7px',
                        fontSize: '12px', fontWeight: '600', color: '#B91C1C', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, fontFamily: 'inherit',
                    }}>
                        {isDesktop ? 'Done editing' : <X size={14} />}
                    </button>
                ) : (
                    <button onClick={() => { setIsEditing(true); setTimeout(() => textareaRef.current?.focus(), 50); }}
                        title="Edit transcript" style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: '30px', height: '30px', background: '#F5F4F0',
                            border: 'none', borderRadius: '7px', cursor: 'pointer', flexShrink: 0,
                        }}>
                        <Pen size={12} color="#57534E" />
                    </button>
                )}

                {/* DOCX */}
                <button onClick={handleDownloadDocx} title="Download Word document" style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    padding: '6px 10px', background: '#EFF6FF', border: 'none', borderRadius: '7px',
                    fontSize: '12px', fontWeight: '600', color: '#1D4ED8', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, fontFamily: 'inherit',
                }}>
                    <FileDown size={12} color="#1D4ED8" />
                    {isDesktop ? 'Word' : '.doc'}
                </button>

                {/* PDF */}
                <button onClick={handleDownloadPdf} title="Download PDF" style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    padding: '6px 10px', background: '#FEF2F2', border: 'none', borderRadius: '7px',
                    fontSize: '12px', fontWeight: '600', color: '#DC2626', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, fontFamily: 'inherit',
                }}>
                    <File size={12} color="#DC2626" />
                    {isDesktop ? 'PDF' : 'PDF'}
                </button>

                {/* Copy */}
                <button onClick={handleCopy} title={copied ? 'Copied!' : 'Copy text'} style={{
                    display: 'flex', alignItems: 'center', gap: isDesktop ? '6px' : '0',
                    padding: isDesktop ? '6px 12px' : '0',
                    width: isDesktop ? 'auto' : '32px', height: '32px',
                    justifyContent: 'center', flexShrink: 0,
                    background: copied ? '#DCFCE7' : '#1C1917',
                    color: copied ? '#15803D' : '#fff',
                    border: 'none', borderRadius: '7px', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit',
                    fontSize: '12px', fontWeight: '700', whiteSpace: 'nowrap',
                }}>
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {isDesktop && <span>{copied ? 'Copied!' : 'Copy text'}</span>}
                </button>
            </div>
        </div>
    );

    /* â”€â”€ Tip banner â”€â”€ */
    const tipBanner = (
        <div style={{ marginTop: '8px', marginBottom: '14px', background: '#FFFBEB', border: '1px solid #FEF3C7', borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
            <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#92400E', lineHeight: '1.5', fontWeight: '500' }}>
                Did Inkto save you time? Consider tipping the creator to keep the servers running.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <a href="https://paystack.shop/pay/4h04eqpye7" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#10B981', color: '#fff', textDecoration: 'none', padding: '9px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: '700' }}>
                    <IconPaystack size={14} /> Tip (NGN)
                </a>
                <a href="https://paypal.me/frankyideal25" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#F59E0B', color: '#fff', textDecoration: 'none', padding: '9px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: '700' }}>
                    <IconPayPal size={14} /> Tip (USD)
                </a>
            </div>
        </div>
    );

    /* â”€â”€ Shared textarea styles â”€â”€ */
    const textareaStyleMobile = {
        display: 'block', width: '100%', height: isNoText ? 'auto' : '380px',
        minHeight: isNoText ? '80px' : undefined,
        padding: '22px', border: 'none', outline: 'none',
        fontFamily: isNoText ? "'Inter', sans-serif" : "'EB Garamond', Georgia, serif",
        fontSize: isNoText ? '14px' : '16px',
        lineHeight: '1.9', color: isNoText ? '#78716C' : '#1C1917',
        fontStyle: isNoText ? 'italic' : 'normal',
        background: '#fff', resize: 'none',
        boxSizing: 'border-box', overflowY: 'auto', WebkitOverflowScrolling: 'touch',
    };

    const textareaStyleDesktop = {
        ...textareaStyleMobile,
        height: isNoText ? 'auto' : undefined,
        minHeight: isNoText ? '80px' : '65vh',
        padding: '40px 48px',
        fontSize: isNoText ? '15px' : '18px',
        lineHeight: '2.1',
        resize: isNoText ? 'none' : 'vertical',
    };

    /* â”€â”€ Status badge â”€â”€ */
    const statusBadge = (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <div style={{
                width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
                background: isNoText ? '#F59E0B' : '#15803D', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800',
            }}>
                {isNoText ? '!' : 'âœ“'}
            </div>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#44403C' }}>
                {isNoText ? 'No text found' : 'Transcription complete'}
            </span>
            <div style={{ flex: 1, height: '1px', background: '#E4E2DC' }} />
            {!isNoText && <span style={{ fontSize: '11px', color: '#A8A29E', whiteSpace: 'nowrap' }}>{stats.words.toLocaleString()} words</span>}
        </div>
    );

    /* â”€â”€ Desktop layout â”€â”€ */
    if (isDesktop) {
        return (
            <div style={{ animation: 'fadeIn 0.4s ease' }} className="desktop-split">
                {images.length > 0 && (
                    <div className="left-pane" style={{ background: '#FAFAF9', borderRight: '1px solid #E4E2DC', overflow: 'hidden', padding: 0, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '12px 16px', borderBottom: '1px solid #E4E2DC', background: '#fff', flexShrink: 0 }}>
                            <span style={{ fontSize: '12px', fontWeight: '700', color: '#78716C', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Source Documents</span>
                        </div>
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                            <FilmstripViewer images={images} />
                        </div>
                    </div>
                )}

                <div className="right-pane" style={{ padding: '24px', overflowY: 'auto' }}>
                    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                        {statusBadge}
                        {!isNoText && emailRow}

                        <div style={{ background: '#fff', border: '1px solid #E4E2DC', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: '10px' }}>
                            {toolbar}
                            <div style={{ position: 'relative' }}>
                                <RichEditor
                                    content={value}
                                    onChange={handleChange}
                                    readOnly={!isEditing || isNoText}
                                    style={textareaStyleDesktop}
                                />
                                {showScrollTop && (
                                    <button onClick={scrollToTop} style={{ position: 'absolute', bottom: '16px', right: '16px', width: '36px', height: '36px', background: 'rgba(28,25,23,0.65)', border: 'none', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                                        <ChevronUp size={16} color="white" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {!isNoText && tipBanner}

                        <button onClick={onReset} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '13px', background: '#FAFAF9', border: '1px solid #E4E2DC', borderRadius: '10px', fontSize: '13px', fontWeight: '600', color: '#78716C', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit' }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#F0EFEB'; e.currentTarget.style.color = '#44403C'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#FAFAF9'; e.currentTarget.style.color = '#78716C'; }}>
                            <RotateCcw size={13} /> New document
                        </button>
                    </div>
                </div>

                {showInboxModal && <InboxModal onClose={() => setShowInboxModal(false)} onSend={handleSendEmail} />}
            </div>
        );
    }

    /* â”€â”€ Mobile layout â”€â”€ */
    return (
        <div style={{ animation: 'fadeIn 0.4s ease' }}>
            {statusBadge}
            {!isNoText && emailRow}

            <div style={{ background: '#fff', border: '1px solid #E4E2DC', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: '10px' }}>
                {toolbar}
                <div style={{ position: 'relative' }}>
                    <RichEditor
                                    content={value}
                                    onChange={handleChange}
                                    readOnly={!isEditing || isNoText}
                                    style={textareaStyleMobile}
                                />
                    {showScrollTop && (
                        <button onClick={scrollToTop} style={{ position: 'absolute', bottom: '12px', right: '12px', width: '32px', height: '32px', background: 'rgba(28,25,23,0.65)', border: 'none', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                            <ChevronUp size={15} color="white" />
                        </button>
                    )}
                </div>
            </div>

            {!isNoText && tipBanner}

            <button onClick={onReset} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '13px', background: '#FAFAF9', border: '1px solid #E4E2DC', borderRadius: '10px', fontSize: '13px', fontWeight: '600', color: '#78716C', cursor: 'pointer', transition: 'all 0.2s', marginBottom: '32px', fontFamily: 'inherit' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#F0EFEB'; e.currentTarget.style.color = '#44403C'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#FAFAF9'; e.currentTarget.style.color = '#78716C'; }}>
                <RotateCcw size={13} /> New document
            </button>

            {showInboxModal && <InboxModal onClose={() => setShowInboxModal(false)} onSend={handleSendEmail} />}
        </div>
    );
}



