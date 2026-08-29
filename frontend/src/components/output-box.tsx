/* eslint-disable */
// @ts-nocheck
'use client';
import dynamic from 'next/dynamic';
const RichEditor = dynamic(() => import('./rich-editor'), { ssr: false });
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Copy, Check, RotateCcw, FileText, FileDown, ChevronUp, Mail, Pen, X, File, Image as ImageIcon, Bookmark, Mic, Loader2 } from 'lucide-react';

/* Ã¢â€â‚¬Ã¢â€â‚¬ Inline SVGs Ã¢â€â‚¬Ã¢â€â‚¬ */
const IconPaystack = ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M4 17h6v4H4v-4zM14 17h6v4h-6v-4zM4 10h6v4H4v-4zM14 10h6v4h-6v-4zM4 3h6v4H4V3z" /></svg>
);
const IconPayPal = ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M7.077 16.26l1.3-8.24c.1-.64.65-1.12 1.3-1.12h4.55c2.4 0 3.9 1.15 3.9 3.4 0 2.44-1.5 4.38-4 4.38h-2.02c-.52 0-.96.38-1.04.9l-.6 3.75c-.04.25-.26.43-.51.43H7.43c-.35 0-.6-.33-.53-.66l.17-.84z" />
        <path fillOpacity="0.5" d="M10.77 8.26l-1.3 8.24c-.1.64-.65 1.12-1.3 1.12H5.63c-.35 0-.6.33-.53.66l1.7-10.84c.1-.64.65-1.12 1.3-1.12h4.55c1.47 0 2.57.43 3.24 1.16-.48-.7-1.33-1.16-2.52-1.16H8.82c-.65 0-1.2.48-1.3 1.12L6.22 15.26h2.52c.52 0 .96-.38 1.04-.9l.99-6.1z" />
    </svg>
);

/* Ã¢â€â‚¬Ã¢â€â‚¬ Source document filmstrip viewer Ã¢â€â‚¬Ã¢â€â‚¬ */
const FilmstripViewer = ({ images }) => {
    return (
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px', background: '#F8FAFC' }}>
            {images.map((url, i) => {
                const isPdf = url.includes('.pdf');
                return (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                        {isPdf ? (
                            <div style={{
                                display: 'flex', flexDirection: 'column',
                                alignItems: 'center', justifyContent: 'center',
                                gap: '12px', padding: '48px', textAlign: 'center',
                                background: '#fff', borderRadius: '12px',
                                border: '1px solid #E2E8F0', width: '100%', maxWidth: '800px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                            }}>
                                <FileText size={40} color="#94A3B8" />
                                <div style={{ fontSize: '14px', fontWeight: '600', color: '#64748B' }}>PDF Document</div>
                                <div style={{ fontSize: '12px', color: '#94A3B8' }}>Page {i + 1}</div>
                            </div>
                        ) : (
                            <div style={{ position: 'relative', width: '100%', maxWidth: '800px' }}>
                                <img
                                    src={url}
                                    alt={'Page ' + (i + 1)}
                                    style={{
                                        width: '100%', borderRadius: '12px',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                        display: 'block', border: '1px solid #E2E8F0',
                                    }}
                                />
                                <div style={{
                                    position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)',
                                    background: 'rgba(15, 23, 42, 0.75)', color: '#fff',
                                    fontSize: '12px', fontWeight: '600',
                                    padding: '4px 10px', borderRadius: '20px',
                                    backdropFilter: 'blur(4px)', whiteSpace: 'nowrap'
                                }}>
                                    Page {i + 1} of {images.length}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

/* Format picker modal for Inbox */
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
                <div style={{ width: '40px', height: '4px', background: '#E2E8F0', borderRadius: '99px', margin: '0 auto 24px' }} />

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', margin: 0, letterSpacing: '-0.3px' }}>
                        Choose attachment format
                    </h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#94A3B8' }}>
                        <X size={20} />
                    </button>
                </div>
                <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '24px', lineHeight: 1.6 }}>
                    Select which formats to attach to the email. The secure session link is always included.
                </p>

                {/* Options */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                    {[
                        { key: 'docx', label: 'Word Document', sub: 'Editable .docx file', color: '#4F46E5', bg: '#E0E7FF' },
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
                                    border: `2px solid ${active ? color : '#E2E8F0'}`,
                                    background: active ? bg : '#F8FAFC',
                                    transition: 'all 0.18s ease',
                                    textAlign: 'left', width: '100%', fontFamily: 'inherit',
                                }}
                            >
                                <div style={{
                                    width: '40px', height: '40px', borderRadius: '10px',
                                    background: active ? color : '#E2E8F0',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0, transition: 'all 0.18s',
                                }}>
                                    <File size={18} color="#fff" />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '14px', fontWeight: '700', color: active ? color : '#475569' }}>{label}</div>
                                    <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>{sub}</div>
                                </div>
                                <div style={{
                                    width: '22px', height: '22px', borderRadius: '50%',
                                    border: `2px solid ${active ? color : '#CBD5E1'}`,
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
                        background: canSend ? '#0F172A' : '#E2E8F0',
                        color: canSend ? '#fff' : '#94A3B8',
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

/* Ã¢â€â‚¬Ã¢â€â‚¬ Download helper (works on mobile too) Ã¢â€â‚¬Ã¢â€â‚¬ */
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

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
        
        if (Capacitor.isNativePlatform()) {
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = async () => {
                try {
                    const base64data = reader.result.toString().split(',')[1];
                    const writeRes = await Filesystem.writeFile({
                        path: filename,
                        data: base64data,
                        directory: Directory.Cache
                    });
                    await Share.share({ title: filename, url: writeRes.uri });
                } catch (e) {
                    alert("Failed to share file: " + e.message);
                }
            };
        } else {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    } catch (err) {
        alert(err.message || fallbackMsg);
    }
}

/* Ã¢â€â‚¬Ã¢â€â‚¬ Main component Ã¢â€â‚¬Ã¢â€â‚¬ */
export default function OutputBox({ text, sessionId, images = [], audioUrl = null, onReset }) {
    const [value, setValue] = useState(text);
    const [copied, setCopied] = useState(false);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
    const [isEditing, setIsEditing] = useState(false);
    const [activeTab, setActiveTab] = useState<'split' | 'original' | 'result'>('split');
    const [hasReviewed, _setHasReviewed] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('inkto_reviewed_' + sessionId) === 'true';
        }
        return false;
    });
    const setHasReviewed = (val: boolean) => {
        _setHasReviewed(val);
        if (val) localStorage.setItem('inkto_reviewed_' + sessionId, 'true');
    };

    const [email, setEmail] = useState(() => localStorage.getItem('inkto_last_email') || '');
    const [sendingEmail, setSendingEmail] = useState(false);
    const [emailStatus, setEmailStatus] = useState(null);
    const [emailFocused, setEmailFocused] = useState(false);
    const [showInboxModal, setShowInboxModal] = useState(false);

    const [isConvertingVoice, setIsConvertingVoice] = useState(false);
    const [voiceProgressStep, setVoiceProgressStep] = useState(1);
    const [voiceError, setVoiceError] = useState(null);

    const textareaRef = useRef(null);
    const debounceTimer = useRef(null);
    const [deferredValue, setDeferredValue] = useState(text);

    const handleConvertVoice = async () => {
        if (!audioUrl) {
            alert("No audio URL found for this recording.");
            return;
        }
        setIsConvertingVoice(true);
        setVoiceProgressStep(1);
        setVoiceError(null);

        const t1 = setTimeout(() => setVoiceProgressStep(2), 800);
        const t2 = setTimeout(() => setVoiceProgressStep(3), 2000);
        const t3 = setTimeout(() => setVoiceProgressStep(4), 3800);

        try {
            const res = await fetch('https://inkto.jointaccount.org/api/transcribe-past', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: sessionId, fileUrl: audioUrl, title: 'Voice Dictation' })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Conversion failed');
            
            clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
            setVoiceProgressStep(4);
            await new Promise(r => setTimeout(r, 600));

            setValue(data.text);
            setIsConvertingVoice(false);
        } catch (e: any) {
            clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
            setVoiceError(e.message || 'ASR transcription failed.');
            setIsConvertingVoice(false);
        }
    };

    const renderRawAudioDashboard = () => {
        if (isConvertingVoice) {
            return (
                <div style={{ padding: '40px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', margin: '20px 0', textAlign: 'left' }}>
                    <p style={{ fontWeight: '700', fontSize: '15px', color: '#0F172A', textAlign: 'center', marginBottom: '20px' }}>
                        Transcribing voice recordingâ€¦
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '320px', margin: '0 auto' }}>
                        {/* Step 1 */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px' }}>
                            {voiceProgressStep > 1 ? (
                                <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#10B981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold', shrink: 0 }}>âœ“</div>
                            ) : (
                                <Loader2 size={16} className="animate-spin text-primary shrink-0" />
                            )}
                            <span style={{ fontWeight: voiceProgressStep >= 1 ? '600' : 'normal', color: voiceProgressStep >= 1 ? '#0F172A' : '#64748B' }}>
                                Packaging audio file
                            </span>
                        </div>
                        {/* Step 2 */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px' }}>
                            {voiceProgressStep > 2 ? (
                                <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#10B981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold', shrink: 0 }}>âœ“</div>
                            ) : voiceProgressStep === 2 ? (
                                <Loader2 size={16} className="animate-spin text-primary shrink-0" />
                            ) : (
                                <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '1.5px solid #CBD5E1', shrink: 0 }} />
                            )}
                            <span style={{ fontWeight: voiceProgressStep >= 2 ? '600' : 'normal', color: voiceProgressStep >= 2 ? '#0F172A' : '#64748B' }}>
                                Connecting to speech engines
                            </span>
                        </div>
                        {/* Step 3 */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px' }}>
                            {voiceProgressStep > 3 ? (
                                <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#10B981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold', shrink: 0 }}>âœ“</div>
                            ) : voiceProgressStep === 3 ? (
                                <Loader2 size={16} className="animate-spin text-primary shrink-0" />
                            ) : (
                                <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '1.5px solid #CBD5E1', shrink: 0 }} />
                            )}
                            <span style={{ fontWeight: voiceProgressStep >= 3 ? '600' : 'normal', color: voiceProgressStep >= 3 ? '#0F172A' : '#64748B' }}>
                                Analyzing vocabulary & dialect
                            </span>
                        </div>
                        {/* Step 4 */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px' }}>
                            {voiceProgressStep === 4 ? (
                                <Loader2 size={16} className="animate-spin text-primary shrink-0" />
                            ) : (
                                <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '1.5px solid #CBD5E1', shrink: 0 }} />
                            )}
                            <span style={{ fontWeight: voiceProgressStep >= 4 ? '600' : 'normal', color: voiceProgressStep >= 4 ? '#0F172A' : '#64748B' }}>
                                Generating legal transcription
                            </span>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div style={{ padding: '36px 24px', background: '#F8FAFC', borderRadius: '16px', border: '1px solid #E2E8F0', margin: '20px 0', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Mic size={24} color="#D97706" />
                </div>
                <div>
                    <h4 style={{ fontWeight: '700', fontSize: '16px', color: '#0F172A', margin: '0 0 6px 0' }}>Raw Voice Dictation</h4>
                    <p style={{ fontSize: '13px', color: '#64748B', margin: 0, maxWidth: '280px', lineHeight: 1.5 }}>
                        You saved this voice recording. You can listen to the audio below or convert it to editable text now.
                    </p>
                </div>

                {audioUrl && (
                    <audio src={audioUrl} controls style={{ width: '100%', maxWidth: '320px', marginTop: '8px' }} />
                )}

                {voiceError && (
                    <p style={{ fontSize: '12px', fontWeight: '600', color: '#DC2626', margin: 0 }}>
                        {voiceError}
                    </p>
                )}

                <button
                    onClick={handleConvertVoice}
                    style={{
                        padding: '12px 24px', background: '#4F46E5', color: '#fff',
                        border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                        boxShadow: '0 4px 12px rgba(37,99,235,0.18)', transition: 'all 0.2s',
                        fontFamily: 'inherit'
                    }}
                >
                    <FileText size={16} /> Convert to Editable Text
                </button>
            </div>
        );
    };

    const isNoText = value.startsWith('[No handwritten text found') || 
                     value.startsWith('[No text present') || 
                     value.startsWith('[Raw voice dictation') || 
                     value.startsWith('[No legible text');

    const handleSaveTemplate = async () => {
        const title = prompt('Enter a title for this custom template:');
        if (!title || !title.trim()) return;
        try {
            const token = localStorage.getItem('inkto_session');
            const headers = { 'Content-Type': 'application/json' };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
                headers['X-Inkto-Auth'] = token;
            }
            const res = await fetch('https://inkto.jointaccount.org/api/user-templates', {
                method: 'POST',
                headers,
                credentials: 'include',
                body: JSON.stringify({ title, content: value })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Save template failed');
            alert('Saved to "My Templates" in the Templates tab!');
        } catch (e) {
            alert(e.message || 'Failed to save template. Please try again.');
        }
    };

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
        if (isNoText) return { words: 0 };
        const words = deferredValue.trim().split(/\s+/).filter(Boolean).length;
        return { words };
    }, [deferredValue, isNoText]);

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
        if (!hasReviewed) {
            alert("Please review and confirm the AI transcript first.");
            return;
        }
        if (!validateEmail(email)) {
            setEmailStatus({ type: 'error', msg: 'Enter a valid email address.' });
            return;
        }
        setSendingEmail(true);
        setEmailStatus(null);
        localStorage.setItem('inkto_last_email', email);
        try {
            const res = await fetch('https://inkto.jointaccount.org/api/send-email', {
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
        setSendingEmail(true);
        setEmailStatus(null);
        try {
            const token = localStorage.getItem('inkto_session');
            const userEmail = email || (typeof window !== 'undefined' ? localStorage.getItem('inkto_user_email') : '');
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;
            const res = await fetch('https://inkto.jointaccount.org/api/save-history', {
                method: 'POST',
                headers,
                credentials: 'include',
                body: JSON.stringify({ email: userEmail, sessionId }),
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

    /* Ã¢â€â‚¬Ã¢â€â‚¬ Email row Ã¢â€â‚¬Ã¢â€â‚¬ */
    const emailRow = (
        <div style={{
            background: '#fff', border: '1px solid #E2E8F0',
            borderRadius: '12px', padding: '14px 16px',
            marginBottom: '10px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{
                    flex: '1 1 180px', minWidth: 0,
                    border: `1.5px solid ${emailFocused ? '#4338CA' : '#E2E8F0'}`,
                    borderRadius: '8px', background: '#F8FAFC',
                    transition: 'border-color 0.2s',
                    boxShadow: emailFocused ? '0 0 0 3px rgba(29,78,216,0.08)' : 'none',
                    display: 'flex', alignItems: 'center', padding: '0 10px',
                }}>
                    <Mail size={14} color="#94A3B8" style={{ flexShrink: 0 }} />
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
                            background: 'transparent', color: '#0F172A',
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
                        disabled={sendingEmail || !hasReviewed}
                        style={{
                            padding: '9px 14px',
                            background: '#4F46E5', color: '#fff',
                            border: 'none', borderRadius: '8px',
                            fontSize: '13px', fontWeight: '700',
                            cursor: (sendingEmail || !hasReviewed) ? 'not-allowed' : 'pointer',
                            opacity: (sendingEmail || !hasReviewed) ? 0.5 : 1,
                            whiteSpace: 'nowrap', fontFamily: 'inherit',
                        }}
                    >
                        Email transcript
                    </button>
                    <button
                        onClick={handleSaveHistory}
                        disabled={sendingEmail || !hasReviewed}
                        style={{
                            padding: '9px 14px',
                            background: '#0F172A', color: '#fff',
                            border: 'none', borderRadius: '8px',
                            fontSize: '13px', fontWeight: '700',
                            cursor: (sendingEmail || !hasReviewed) ? 'not-allowed' : 'pointer',
                            opacity: (sendingEmail || !hasReviewed) ? 0.5 : 1,
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

    /* Ã¢â€â‚¬Ã¢â€â‚¬ Toolbar Ã¢â€â‚¬Ã¢â€â‚¬ */
    const toolbar = (
        <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 14px', borderBottom: '1px solid #F1F5F9',
            background: '#F8FAFC', flexWrap: 'nowrap', gap: '6px',
            overflowX: 'auto',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                <FileText size={13} color="#CBD5E1" />
                <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: '600', whiteSpace: 'nowrap' }}>Transcript</span>
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
                            width: '30px', height: '30px', background: '#F1F5F9',
                            border: 'none', borderRadius: '7px', cursor: 'pointer', flexShrink: 0,
                        }}>
                        <Pen size={12} color="#64748B" />
                    </button>
                )}

                {/* DOCX */}
                <button onClick={handleDownloadDocx} disabled={!hasReviewed} title="Download Word document" style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    padding: '6px 10px', background: '#E0E7FF', border: 'none', borderRadius: '7px',
                    fontSize: '12px', fontWeight: '600', color: '#4338CA',
                    cursor: hasReviewed ? 'pointer' : 'not-allowed',
                    opacity: hasReviewed ? 1 : 0.4,
                    whiteSpace: 'nowrap', flexShrink: 0, fontFamily: 'inherit',
                }}>
                    <FileDown size={12} color="#4338CA" />
                    {isDesktop ? 'Word' : '.doc'}
                </button>

                {/* PDF */}
                <button onClick={handleDownloadPdf} disabled={!hasReviewed} title="Download PDF" style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    padding: '6px 10px', background: '#FEF2F2', border: 'none', borderRadius: '7px',
                    fontSize: '12px', fontWeight: '600', color: '#DC2626',
                    cursor: hasReviewed ? 'pointer' : 'not-allowed',
                    opacity: hasReviewed ? 1 : 0.4,
                    whiteSpace: 'nowrap', flexShrink: 0, fontFamily: 'inherit',
                }}>
                    <File size={12} color="#DC2626" />
                    {isDesktop ? 'PDF' : 'PDF'}
                </button>

                {/* Save as Template */}
                <button onClick={handleSaveTemplate} title="Save as custom template" style={{
                    display: 'flex', alignItems: 'center', gap: isDesktop ? '6px' : '0',
                    padding: isDesktop ? '6px 12px' : '0',
                    width: isDesktop ? 'auto' : '32px', height: '32px',
                    justifyContent: 'center', flexShrink: 0,
                    background: '#F1F5F9',
                    color: '#64748B',
                    border: 'none', borderRadius: '7px', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit',
                    fontSize: '12px', fontWeight: '700', whiteSpace: 'nowrap',
                }}>
                    <Bookmark size={14} color="#64748B" />
                    {isDesktop && <span>Save Template</span>}
                </button>

                {/* Copy */}
                <button onClick={handleCopy} title={copied ? 'Copied!' : 'Copy text'} style={{
                    display: 'flex', alignItems: 'center', gap: isDesktop ? '6px' : '0',
                    padding: isDesktop ? '6px 12px' : '0',
                    width: isDesktop ? 'auto' : '32px', height: '32px',
                    justifyContent: 'center', flexShrink: 0,
                    background: copied ? '#DCFCE7' : '#0F172A',
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
    const tipBanner = null;

    /* Ã¢â€â‚¬Ã¢â€â‚¬ Shared textarea styles Ã¢â€â‚¬Ã¢â€â‚¬ */
    const textareaStyleMobile = {
        display: 'block', width: '100%', height: isNoText ? 'auto' : '380px',
        minHeight: isNoText ? '80px' : undefined,
        padding: '22px', border: 'none', outline: 'none',
        fontFamily: isNoText ? "'Inter', sans-serif" : "'EB Garamond', Georgia, serif",
        fontSize: isNoText ? '14px' : '16px',
        lineHeight: '1.9', color: isNoText ? '#64748B' : '#0F172A',
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

    /* -- Status badge -- */
    const statusBadge = (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <div style={{
                width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
                background: isNoText ? '#F59E0B' : '#15803D', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800',
            }}>
                {isNoText ? '!' : <Check size={13} strokeWidth={3} />}
            </div>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#475569' }}>
                {isNoText ? 'No text found' : 'Transcription complete'}
            </span>
            <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }} />
            {!isNoText && <span style={{ fontSize: '11px', color: '#94A3B8', whiteSpace: 'nowrap' }}>{stats.words.toLocaleString()} words</span>}
        </div>
    );

    /* â”€â”€ Tab toggle â”€â”€ */
        const persistentAudioPlayer = audioUrl && !value.startsWith('[Raw voice dictation') ? (
        <div style={{ padding: '12px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', marginBottom: '16px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Original Audio</span>
            <audio src={audioUrl} controls style={{ width: '100%', height: '40px' }} />
        </div>
    ) : null;

    const tabToggle = images.length > 0 && (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '12px 24px',
            borderBottom: '1px solid #E2E8F0',
            background: '#F8FAFC',
            borderRadius: 12,
            border: '1px solid #E2E8F0',
            flexShrink: 0
        }}>
            <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: 8, padding: 3, gap: 2, border: '1px solid #E2E8F0' }}>
                {(['split', 'original', 'result'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            padding: '6px 16px',
                            borderRadius: 6,
                            border: 'none',
                            background: activeTab === tab ? '#FFFFFF' : 'transparent',
                            color: activeTab === tab ? '#0F172A' : '#64748B',
                            fontWeight: 700,
                            fontSize: 12,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            cursor: 'pointer',
                            boxShadow: activeTab === tab ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                            transition: 'all 0.15s',
                            fontFamily: 'inherit',
                        }}
                    >
                        {tab}
                    </button>
                ))}
            </div>
        </div>
    );

    /* â”€â”€ AI Review Gate banner â”€â”€ */
    const reviewBanner = !hasReviewed && !value.startsWith('[Raw voice dictation') && (
        <div style={{
            border: '1.5px solid #DC2626',
            background: '#FEF2F2',
            borderRadius: 10,
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
            boxSizing: 'border-box',
            marginBottom: 16
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, color: '#991B1B', fontWeight: 700 }}>
                    âš ï¸ AI-generated â€” review carefully before use
                </span>
            </div>
            <button
                onClick={() => setHasReviewed(true)}
                style={{
                    background: '#DC2626',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 6,
                    padding: '6px 14px',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    boxShadow: '0 2px 8px rgba(220,38,38,0.25)',
                    transition: 'background 0.15s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#B91C1C'}
                onMouseLeave={e => e.currentTarget.style.background = '#DC2626'}
            >
                I've Reviewed
            </button>
        </div>
    );

    /* â”€â”€ Desktop layout â”€â”€ */
    if (isDesktop) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.4s ease', gap: 16 }}>
                {persistentAudioPlayer}
                {tabToggle}
                {reviewBanner}
                
                <div className="desktop-split" style={{ display: 'flex', height: 'calc(100vh - 180px)', overflow: 'hidden' }}>
                    {images.length > 0 && (activeTab === 'split' || activeTab === 'original') && (
                        <div className="left-pane" style={{
                            background: '#F8FAFC',
                            borderRight: '1px solid #E2E8F0',
                            overflow: 'hidden',
                            padding: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            width: activeTab === 'original' ? '100%' : '50%'
                        }}>
                            <div style={{ padding: '12px 16px', borderBottom: '1px solid #E2E8F0', background: '#fff', flexShrink: 0 }}>
                                <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Source Documents</span>
                            </div>
                            <div style={{ flex: 1, overflow: 'hidden' }}>
                                <FilmstripViewer images={images} />
                            </div>
                        </div>
                    )}

                    {(activeTab === 'split' || activeTab === 'result') && (
                        <div className="right-pane" style={{
                            width: activeTab === 'result' ? '100%' : '50%',
                            padding: '24px',
                            overflowY: 'auto'
                        }}>
                            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                                {statusBadge}
                                {!isNoText && emailRow}

                                <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: '10px' }}>
                                    {toolbar}
                                    <div style={{ position: 'relative' }}>
                                        {value.startsWith('[Raw voice dictation') ? (
                                            renderRawAudioDashboard()
                                        ) : (
                                            <>
                                                
                                                <RichEditor
                                                    content={value}
                                                    onChange={handleChange}
                                                    readOnly={!isEditing || isNoText}
                                                    style={textareaStyleDesktop}
                                                />
                                            </>
                                        )}
                                        {showScrollTop && !value.startsWith('[Raw voice dictation') && (
                                            <button onClick={scrollToTop} style={{ position: 'absolute', bottom: '16px', right: '16px', width: '36px', height: '36px', background: 'rgba(28,25,23,0.65)', border: 'none', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                                                <ChevronUp size={16} color="white" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {!isNoText && tipBanner}

                                <button onClick={onReset} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '13px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', fontSize: '13px', fontWeight: '600', color: '#64748B', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit' }}
                                    onMouseEnter={e => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#475569'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#64748B'; }}>
                                    <RotateCcw size={13} /> New document
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {showInboxModal && <InboxModal onClose={() => setShowInboxModal(false)} onSend={handleSendEmail} />}
            </div>
        );
    }

    /* â”€â”€ Mobile layout â”€â”€ */
    return (
        <div className="font-sans" style={{ animation: 'fadeIn 0.4s ease', display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: -4 }}>
                <button onClick={onReset} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#4338CA', fontWeight: 600, fontSize: 14, cursor: 'pointer', padding: '8px 0' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                    Back
                </button>
            </div>
            {persistentAudioPlayer}
                {tabToggle}
            {reviewBanner}

            {images.length > 0 && (activeTab === 'split' || activeTab === 'original') && (
                <div style={{
                    height: activeTab === 'original' ? 'calc(100vh - 200px)' : '260px',
                    border: '1px solid #E2E8F0',
                    borderRadius: 12,
                    overflow: 'hidden',
                    background: '#F8FAFC'
                }}>
                    <FilmstripViewer images={images} />
                </div>
            )}

            {(activeTab === 'split' || activeTab === 'result') && (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {statusBadge}
                    {!isNoText && emailRow}

                    <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: '10px' }}>
                        {toolbar}
                        <div style={{ position: 'relative' }}>
                            {value.startsWith('[Raw voice dictation') ? (
                                renderRawAudioDashboard()
                            ) : (
                                <RichEditor
                                    content={value}
                                    onChange={handleChange}
                                    readOnly={!isEditing || isNoText}
                                    style={textareaStyleMobile}
                                />
                            )}
                            {showScrollTop && !value.startsWith('[Raw voice dictation') && (
                                <button onClick={scrollToTop} style={{ position: 'absolute', bottom: '12px', right: '12px', width: '32px', height: '32px', background: 'rgba(28,25,23,0.65)', border: 'none', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                                    <ChevronUp size={15} color="white" />
                                </button>
                            )}
                        </div>
                    </div>

                    {!isNoText && tipBanner}

                    <button onClick={onReset} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '13px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', fontSize: '13px', fontWeight: '600', color: '#64748B', cursor: 'pointer', transition: 'all 0.2s', marginBottom: '32px', fontFamily: 'inherit' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#475569'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#64748B'; }}>
                        <RotateCcw size={13} /> New document
                    </button>
                </div>
            )}

            {showInboxModal && <InboxModal onClose={() => setShowInboxModal(false)} onSend={handleSendEmail} />}
        </div>
    );
}






