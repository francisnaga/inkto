/* eslint-disable */
// @ts-nocheck
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { InktoLogo } from './inkto-logo';

/* ── Design tokens (matching Inkto app & web tokens) ── */
const T = {
    bg:         '#FAFAF9', /* Warm off-white */
    surface:    '#FFFFFF', /* Pure white card */
    border:     '#E5E7EB', /* Light grey border */
    ink:        '#111827', /* Deep charcoal text */
    ink2:       '#1F2937',
    ink3:       '#4B5563',
    ink4:       '#9CA3AF', /* Muted grey secondary text */
    accent:     '#0060FF', /* Vibrant Google Play brand blue */
    accentL:    '#EBF3FF',
    slate:      '#0E0F12', /* Deep obsidian app background */
    cardDark:   '#141519', /* Elevated card surface */
    borderDark: '#22252B', /* Subtle card border */
};

const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.inkto.app";

/* ── Inline SVG icons ── */
const Ic = {
    Arrow:   (p: any) => <svg width={p.s||16} height={p.s||16} viewBox="0 0 24 24" fill="none" stroke={p.c||'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>,
    Check:   (p: any) => <svg width={p.s||16} height={p.s||16} viewBox="0 0 24 24" fill="none" stroke={p.c||'currentColor'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>,
    Camera:  (p: any) => <svg width={p.s||16} height={p.s||16} viewBox="0 0 24 24" fill="none" stroke={p.c||'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>,
    File:    (p: any) => <svg width={p.s||16} height={p.s||16} viewBox="0 0 24 24" fill="none" stroke={p.c||'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>,
    Mail:    (p: any) => <svg width={p.s||16} height={p.s||16} viewBox="0 0 24 24" fill="none" stroke={p.c||'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>,
    Zap:     (p: any) => <svg width={p.s||16} height={p.s||16} viewBox="0 0 24 24" fill="none" stroke={p.c||'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
    Shield:  (p: any) => <svg width={p.s||16} height={p.s||16} viewBox="0 0 24 24" fill="none" stroke={p.c||'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    Clock:   (p: any) => <svg width={p.s||16} height={p.s||16} viewBox="0 0 24 24" fill="none" stroke={p.c||'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    Chevron: (p: any) => <svg width={p.s||16} height={p.s||16} viewBox="0 0 24 24" fill="none" stroke={p.c||'#94A3B8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,transform:p.open?'rotate(180deg)':'rotate(0deg)',transition:'transform 0.25s ease'}}><path d="m6 9 6 6 6-6"/></svg>,
    Github:  (p: any) => <svg width={p.s||16} height={p.s||16} viewBox="0 0 24 24" fill="none" stroke={p.c||'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>,
    Twitter: (p: any) => <svg width={p.s||16} height={p.s||16} viewBox="0 0 24 24" fill="none" stroke={p.c||'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>,
    Paystack:(p: any) => <svg width={p.s||16} height={p.s||16} viewBox="0 0 24 24" fill="currentColor"><path d="M4 17h6v4H4v-4zM14 17h6v4h-6v-4zM4 10h6v4H4v-4zM14 10h6v4h-6v-4zM4 3h6v4H4V3z"/></svg>,
    PayPal:  (p: any) => <svg width={p.s||16} height={p.s||16} viewBox="0 0 24 24" fill="currentColor"><path d="M7.077 16.26l1.3-8.24c.1-.64.65-1.12 1.3-1.12h4.55c2.4 0 3.9 1.15 3.9 3.4 0 2.44-1.5 4.38-4 4.38h-2.02c-.52 0-.96.38-1.04.9l-.6 3.75c-.04.25-.26.43-.51.43H7.43c-.35 0-.6-.33-.53-.66l.17-.84z"/><path fillOpacity="0.5" d="M10.77 8.26l-1.3 8.24c-.1.64-.65 1.12-1.3 1.12H5.63c-.35 0-.6.33-.53.66l1.7-10.84c.1-.64.65-1.12 1.3-1.12h4.55c1.47 0 2.57.43 3.24 1.16-.48-.7-1.33-1.16-2.52-1.16H8.82c-.65 0-1.2.48-1.3 1.12L6.22 15.26h2.52c.52 0 .96-.38 1.04-.9l.99-6.1z"/></svg>,
};

/* Official Logo SVG */
const Logo = ({ size = 28 }: { size?: number }) => (
    <InktoLogo size={size} variant="squircle" bg="#0060FF" style={{ filter: 'drop-shadow(0 3px 8px rgba(0, 96, 255, 0.32))' }} />
);

function Img({ src, alt, style }: any) {
    const [loaded, setLoaded] = useState(false);
    const imgRef = React.useRef<HTMLImageElement>(null);

    React.useEffect(() => {
        if (imgRef.current?.complete) {
            setLoaded(true);
        }
    }, [src]);

    return (
        <div style={{ position: 'relative', ...style }}>
            {!loaded && (
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(90deg, #EDECE8 25%, #F5F4F0 50%, #EDECE8 75%)',
                    backgroundSize: '400px 100%',
                    animation: 'shimmer 1.4s ease-in-out infinite',
                    borderRadius: 'inherit',
                }} />
            )}
            <img
                ref={imgRef}
                src={src}
                alt={alt}
                loading="eager"
                decoding="async"
                onLoad={() => setLoaded(true)}
                style={{
                    width: '100%', height: '100%',
                    display: 'block', objectFit: 'cover',
                    opacity: loaded ? 1 : 0,
                    transition: 'opacity 0.4s ease',
                    borderRadius: 'inherit',
                }}
            />
        </div>
    );
}

/* Pill label */
function Pill({ children, dark = false }: any) {
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center',
            fontSize: '10px', fontWeight: '700', letterSpacing: '0.07em',
            padding: '3px 10px', borderRadius: '99px',
            background: dark ? 'rgba(0,0,0,0.55)' : T.accentL,
            color: dark ? '#fff' : T.accent,
            backdropFilter: dark ? 'blur(4px)' : 'none',
        }}>
            {children}
        </span>
    );
}

/* FAQ accordion item */
function FAQItem({ q, a }: any) {
    const [open, setOpen] = useState(false);
    return (
        <div style={{
            background: T.surface, border: `1px solid ${T.border}`,
            borderRadius: '12px', overflow: 'hidden', marginBottom: '6px'
        }}>
            <button
                onClick={() => setOpen(o => !o)}
                style={{
                    width: '100%', display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', gap: '12px',
                    padding: '18px 20px', background: 'none', border: 'none',
                    cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                }}
            >
                <span style={{ fontSize: '15px', fontWeight: '700', color: T.ink, lineHeight: 1.4 }}>{q}</span>
                <Ic.Chevron s={18} open={open} />
            </button>
            {open && (
                <div style={{ padding: '0 20px 18px', fontSize: '14px', color: T.ink3, lineHeight: 1.75 }}>
                    {a}
                </div>
            )}
        </div>
    );
}

/* Section wrapper for consistent vertical rhythm */
const Section = ({ children, style, id }: any) => (
    <section id={id} style={{
        maxWidth: '900px', margin: '0 auto',
        padding: '0 clamp(20px, 5vw, 48px)',
        ...style,
    }}>
        {children}
    </section>
);

const FEATURES = [
    { icon: <Ic.File s={15} c={T.accent} />, label: 'Exports to Word (.docx)' },
    { icon: <Ic.Mail s={15} c={T.accent} />, label: 'Email to yourself or colleague' },
    { icon: <Ic.Shield s={15} c={T.accent} />, label: 'No password required' },
    { icon: <Ic.Clock s={15} c={T.accent} />, label: 'Result in seconds' },
];

const STEPS = [
    { n: '1', Icon: Ic.Camera, title: 'Photograph the document', desc: 'Take a photo on your phone or upload a scanned PDF. Handles up to 30 pages at once. Optimised for affidavits, sworn statements, and handwritten legal filings.' },
    { n: '2', Icon: Ic.Zap, title: 'Read and transcribe', desc: 'The system reads the handwriting, strips crossed-out text, inserts caret additions correctly, and formats everything cleanly. A second AI pass verifies numbers and proper nouns.' },
    { n: '3', Icon: Ic.File, title: 'Copy, download, or email', desc: 'Copy the text directly, download a Word document, or email the transcript. History is saved to your email and available indefinitely — log in with that email at any time.' },
];

const FAQS = [
    { q: 'How do I convert handwriting to text for free?', a: 'Upload a photo or scanned PDF of your handwritten document to Inkto. The system reads the handwriting and returns clean, editable text in seconds. Completely free and no sign up required.' },
    { q: 'Can Inkto transcribe legal documents and affidavits?', a: 'Yes. Inkto is built for legal documents including affidavits, sworn statements, court filings, and other handwritten legal texts. It removes crossed-out words, places caret insertions correctly, and runs a second pass to verify numbers and proper nouns.' },
    { q: 'Is there an Android mobile app for Inkto?', a: 'Yes! Inkto is officially available for download on Google Play (https://play.google.com/store/apps/details?id=com.inkto.app) with hardware camera acceleration and real-time document perspective correction. You can also use the web app on any mobile or desktop browser.' },
    { q: 'What file formats does Inkto accept?', a: 'Inkto accepts JPEG, PNG, and PDF files. You can upload up to 30 pages at once. Output can be copied as plain text or downloaded as a Microsoft Word (.docx) file.' },
    { q: 'How accurate is the handwriting recognition?', a: 'Inkto uses a two-pass verification process. The first pass transcribes the handwriting. The second pass verifies numbers, dates, proper nouns, and legal terms against the original image for legal-grade accuracy.' },
    { q: 'Is my document data private?', a: 'Yes. Unsaved documents are automatically deleted after 7 days for your privacy. Documents you explicitly save or email are kept securely in your history until you delete them. No account is required, and your documents are never used for training models.' },
];

export default function LandingPage() {
    const [ctaHover, setCtaHover] = useState(false);

    return (
        <div style={{ minHeight: '100vh', background: T.bg, fontFamily: "'Inter', -apple-system, sans-serif", color: T.ink }}>

            {/* Global page-level styles */}
            <style>{`
                .lp-hero-grid {
                    display: grid;
                    grid-template-columns: 1fr auto 1fr;
                    align-items: center;
                    gap: 20px;
                    width: 100%;
                    max-width: 840px;
                    margin: 0 auto 48px;
                }
                @media (max-width: 640px) {
                    .lp-hero-grid {
                        grid-template-columns: 1fr;
                        grid-template-rows: auto auto auto;
                    }
                    .lp-hero-arrow { transform: rotate(90deg); justify-self: center; }
                }
                .lp-feat-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                    gap: 20px;
                }
                .lp-feat-mini {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
                    gap: 10px;
                    margin-top: 20px;
                }
                @keyframes shimmer {
                    0%   { background-position: -400px 0; }
                    100% { background-position:  400px 0; }
                }
                .lp-btn-primary {
                    display: inline-flex; align-items: center; gap: 8px;
                    padding: 14px 28px;
                    background: ${T.slate}; color: #fff;
                    border: none; border-radius: 12px;
                    font-size: 15px; font-weight: 700;
                    cursor: pointer; letter-spacing: -0.2px;
                    font-family: inherit;
                    transition: transform 0.18s cubic-bezier(.4,0,.2,1), box-shadow 0.18s cubic-bezier(.4,0,.2,1);
                }
                .lp-btn-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 14px 36px rgba(0,0,0,0.28);
                }
                .lp-btn-accent {
                    display: inline-flex; align-items: center; gap: 8px;
                    padding: 15px 30px;
                    background: ${T.accent}; color: #fff;
                    border: none; border-radius: 12px;
                    font-size: 15px; font-weight: 700;
                    cursor: pointer; letter-spacing: -0.2px;
                    font-family: inherit;
                    box-shadow: 0 6px 24px rgba(0,96,255,0.35);
                    transition: transform 0.18s cubic-bezier(.4,0,.2,1), box-shadow 0.18s cubic-bezier(.4,0,.2,1);
                }
                .lp-btn-accent:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 14px 36px rgba(0,96,255,0.45);
                }
                .lp-step-card {
                    display: flex; gap: 20px; align-items: flex-start;
                    background: ${T.surface}; border: 1px solid ${T.border};
                    border-radius: 16px; padding: 24px 28px;
                    box-shadow: 0 1px 4px rgba(0,0,0,0.04);
                }
                .lp-footer-link {
                    color: ${T.ink4}; display: flex; align-items: center;
                    text-decoration: none; transition: color 0.15s;
                }
                .lp-footer-link:hover { color: ${T.ink3}; }
            `}</style>

            {/* ── Navbar ── */}
            <nav style={{
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: 'max(12px, env(safe-area-inset-top, 0px)) clamp(16px, 5vw, 48px) 12px',
                background: 'rgba(250, 250, 249, 0.94)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                borderBottom: `1px solid ${T.border}`,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Logo size={28} />
                    <span style={{ fontWeight: 800, fontSize: '18px', letterSpacing: '-0.4px', color: T.ink }}>Inkto</span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Link href="/app" className="lp-btn-primary"
                        style={{ padding: '8px 18px', fontSize: '13px', borderRadius: '9px', textDecoration: 'none' }}>
                        Try Free
                    </Link>
                </div>
            </nav>

            {/* ── Hero ── */}
            <section style={{
                maxWidth: '960px', margin: '0 auto',
                padding: 'clamp(120px, 14vw, 144px) clamp(20px, 5vw, 48px) 64px',
                textAlign: 'center',
            }}>
                <h1 style={{
                    fontSize: 'clamp(38px, 7vw, 66px)',
                    fontWeight: 900, lineHeight: 1.04,
                    letterSpacing: '-2.5px', color: T.ink,
                    marginBottom: '22px',
                }}>
                    Handwritten docs,<br />
                    <span style={{
                        background: `linear-gradient(135deg, ${T.accent}, #0EA5E9)`,
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                    }}>
                        typed in seconds.
                    </span>
                </h1>

                <p style={{
                    fontSize: 'clamp(15px, 2.2vw, 18px)', color: T.ink3,
                    maxWidth: '480px', margin: '0 auto 40px',
                    lineHeight: 1.7, fontWeight: 400,
                }}>
                    Snap a photo of any handwritten document and Inkto converts it to clean, editable text.
                </p>

                {/* Before → After demo */}
                <div className="lp-hero-grid">
                    {/* BEFORE */}
                    <div style={{
                        borderRadius: '16px', overflow: 'hidden',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.10)',
                        border: `1px solid ${T.border}`,
                        position: 'relative',
                    }}>
                        <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 2 }}>
                            <Pill dark>BEFORE</Pill>
                        </div>
                        <Img
                            src="/handwriting_before.jpg"
                            alt="Handwritten affidavit with crossed-out words"
                            style={{ aspectRatio: '4/3' }}
                        />
                    </div>

                    {/* Arrow */}
                    <div className="lp-hero-arrow" style={{ color: T.ink4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Ic.Arrow s={28} c={T.ink4} />
                    </div>

                    {/* AFTER */}
                    <div style={{
                        background: T.surface,
                        border: `1px solid ${T.border}`,
                        borderRadius: '16px',
                        padding: '28px',
                        boxShadow: '0 12px 40px rgba(0,0,0,0.06)',
                        textAlign: 'left',
                        position: 'relative',
                        aspectRatio: '4/3',
                        display: 'flex', flexDirection: 'column', justifyContent: 'center',
                    }}>
                        <div style={{ position: 'absolute', top: '10px', left: '10px' }}>
                            <Pill>AFTER</Pill>
                        </div>
                        <p style={{
                            fontFamily: "'EB Garamond', Georgia, serif",
                            fontSize: 'clamp(16px, 2vw, 20px)',
                            color: T.ink, lineHeight: 1.75,
                            margin: 0,
                        }}>
                            I hereby swear that the claimant was present at the scene on the 14th of March 2024. The said individual did not leave the premises before 6pm.
                        </p>
                    </div>
                </div>

                {/* CTAs: Web App & Google Play */}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                    <Link href="/app" className="lp-btn-primary"
                        style={{
                            boxShadow: ctaHover ? '0 14px 36px rgba(0,0,0,0.28)' : '0 6px 20px rgba(0,0,0,0.18)',
                            textDecoration: 'none'
                        }}
                        onMouseEnter={() => setCtaHover(true)}
                        onMouseLeave={() => setCtaHover(false)}
                    >
                        Start transcribing <Ic.Arrow s={16} c="#fff" />
                    </Link>

                    <a
                        href={PLAY_STORE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ display: 'inline-block', lineHeight: 0 }}
                        aria-label="Get it on Google Play"
                    >
                        <img
                            src="/google-play-badge.png"
                            alt="Get it on Google Play"
                            style={{ height: '48px', width: 'auto', display: 'block' }}
                        />
                    </a>
                </div>

                <p style={{ marginTop: '16px', fontSize: '12px', color: T.ink4, fontWeight: 500 }}>
                    Free. No sign up required. Available on Web and Android.
                </p>
            </section>

            {/* ── Features ── */}
            <Section style={{ marginBottom: '80px' }}>
                <div className="lp-feat-grid">
                    {/* Card A: Edits */}
                    <div style={{
                        background: T.surface, border: `1px solid ${T.border}`,
                        borderRadius: '16px', padding: '28px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                    }}>
                        <h3 style={{ fontSize: '17px', fontWeight: '800', margin: '0 0 18px', color: T.ink, letterSpacing: '-0.3px' }}>
                            Understands edits, not just characters
                        </h3>
                        <div style={{
                            borderRadius: '12px', overflow: 'hidden',
                            border: `1px solid ${T.border}`, marginBottom: '14px',
                            position: 'relative',
                        }}>
                            <div style={{ position: 'absolute', top: '8px', left: '8px', zIndex: 1 }}>
                                <Pill dark>HANDWRITTEN INPUT</Pill>
                            </div>
                            <Img src="/handwriting_edits.jpg" alt="Handwritten text with crossed-out word" style={{ height: '140px' }} />
                        </div>
                        <div style={{
                            background: T.bg, padding: '14px 18px', borderRadius: '10px',
                            border: `1px solid ${T.border}`,
                            fontFamily: "'EB Garamond', Georgia, serif",
                            fontSize: '19px', color: T.ink, position: 'relative',
                        }}>
                            <div style={{ position: 'absolute', top: '-10px', right: '12px' }}>
                                <Pill>CLEAN OUTPUT</Pill>
                            </div>
                            keep this
                        </div>
                    </div>

                    {/* Card B: Structure */}
                    <div style={{
                        background: T.surface, border: `1px solid ${T.border}`,
                        borderRadius: '16px', padding: '28px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                    }}>
                        <h3 style={{ fontSize: '17px', fontWeight: '800', margin: '0 0 18px', color: T.ink, letterSpacing: '-0.3px' }}>
                            Preserves document structure
                        </h3>
                        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                            <div style={{
                                flex: 1, borderRadius: '12px', overflow: 'hidden',
                                border: `1px solid ${T.border}`, position: 'relative',
                            }}>
                                <div style={{ position: 'absolute', top: '8px', left: '8px', zIndex: 1 }}>
                                    <Pill dark>INPUT</Pill>
                                </div>
                                <Img src="/handwriting_list.jpg" alt="Handwritten numbered list" style={{ height: '170px' }} />
                            </div>
                            <div style={{ flexShrink: 0, color: T.ink4 }}>
                                <Ic.Arrow s={16} c={T.ink4} />
                            </div>
                            <div style={{
                                flex: 1, background: T.bg, padding: '14px',
                                borderRadius: '12px', border: `1px solid ${T.border}`,
                                fontFamily: "'EB Garamond', Georgia, serif",
                                fontSize: '15px', color: T.ink, lineHeight: 1.6,
                                position: 'relative', minHeight: '170px',
                                display: 'flex', flexDirection: 'column', justifyContent: 'center',
                            }}>
                                <div style={{ position: 'absolute', top: '-10px', right: '10px' }}>
                                    <Pill>OUTPUT</Pill>
                                </div>
                                <ol style={{ margin: 0, paddingLeft: '18px' }}>
                                    <li style={{ marginBottom: '7px' }}>Exhibit A &mdash; sworn statement</li>
                                    <li style={{ marginBottom: '7px' }}>Exhibit B &mdash; court notice</li>
                                    <li>Exhibit C &mdash; police report</li>
                                </ol>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mini feature pills */}
                <div className="lp-feat-mini">
                    {FEATURES.map((f, i) => (
                        <div key={i} style={{
                            display: 'flex', alignItems: 'center', gap: '9px',
                            background: T.surface, border: `1px solid ${T.border}`,
                            borderRadius: '10px', padding: '12px 16px',
                            fontSize: '13px', fontWeight: '600', color: T.ink2,
                        }}>
                            {f.icon} {f.label}
                        </div>
                    ))}
                </div>
            </Section>

            {/* ── How it works ── */}
            <Section style={{ marginBottom: '96px' }}>
                <div style={{ textAlign: 'center', marginBottom: '44px' }}>
                    <h2 style={{
                        fontSize: 'clamp(24px, 4vw, 34px)', fontWeight: '900',
                        letterSpacing: '-0.8px', color: T.ink, margin: '0 0 10px',
                    }}>
                        From photo to text in three steps
                    </h2>
                    <p style={{ fontSize: '15px', color: T.ink3, margin: 0 }}>No complex setup or training required.</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {STEPS.map((s, i) => (
                        <div key={i} className="lp-step-card">
                            <div style={{
                                width: '44px', height: '44px', borderRadius: '12px',
                                background: T.slate, display: 'flex', alignItems: 'center',
                                justifyContent: 'center', flexShrink: 0,
                            }}>
                                <s.Icon s={20} c="#fff" />
                            </div>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '7px' }}>
                                    <span style={{ fontSize: '11px', fontWeight: '800', color: T.ink4, letterSpacing: '0.08em' }}>{s.n}</span>
                                    <h3 style={{ fontSize: '15px', fontWeight: '800', color: T.ink, margin: 0, letterSpacing: '-0.2px' }}>{s.title}</h3>
                                </div>
                                <p style={{ fontSize: '14px', color: T.ink3, lineHeight: 1.7, margin: 0 }}>{s.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </Section>

            {/* ── Cross-device & Google Play Callout ── */}
            <Section style={{ marginBottom: '96px' }}>
                <div style={{
                    background: T.slate, borderRadius: '20px',
                    padding: 'clamp(32px, 5vw, 52px) clamp(28px, 5vw, 52px)',
                    color: '#fff',
                    border: `1px solid ${T.borderDark}`,
                }}>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                        {['📱 Android Native App', '💻 Web on Laptop/Desktop', '📑 Export to Word (.docx)'].map(t => (
                            <span key={t} style={{
                                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
                                borderRadius: '99px', padding: '5px 14px',
                                fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.75)',
                            }}>{t}</span>
                        ))}
                    </div>
                    <h2 style={{
                        fontSize: 'clamp(22px, 3.5vw, 30px)', fontWeight: '900',
                        letterSpacing: '-0.6px', marginBottom: '14px', lineHeight: 1.2,
                    }}>
                        Transcribe on your phone.<br />Edit on your computer.
                    </h2>
                    <p style={{ color: '#94A3B8', lineHeight: 1.75, fontSize: '14px', marginBottom: '24px', maxWidth: '520px' }}>
                        Install the official Inkto app from Google Play for high-speed edge camera scanning, or use Inkto Web in any desktop browser. Word documents (.docx) are sent directly to your inbox with a secure session link.
                    </p>

                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '28px' }}>
                        <a
                            href={PLAY_STORE_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ display: 'inline-block', lineHeight: 0 }}
                            aria-label="Get it on Google Play"
                        >
                            <img
                                src="/google-play-badge.png"
                                alt="Get it on Google Play"
                                style={{ height: '48px', width: 'auto', display: 'block' }}
                            />
                        </a>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '380px' }}>
                        {[
                            'Word document (.docx) attached to your email',
                            'Secure session link accessible from any device',
                            'Saved documents kept indefinitely in your history',
                            'No passwords required to log in',
                        ].map(t => (
                            <div key={t} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#38BDF8', flexShrink: 0, marginTop: '7px' }} />
                                <span style={{ fontSize: '14px', color: '#CBD5E1', lineHeight: 1.55 }}>{t}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </Section>

            {/* ── Final CTA ── */}
            <section style={{
                textAlign: 'center',
                padding: 'clamp(56px, 8vw, 96px) clamp(20px, 5vw, 48px)',
                background: T.surface,
                borderTop: `1px solid ${T.border}`,
                borderBottom: `1px solid ${T.border}`,
            }}>
                <h2 style={{
                    fontSize: 'clamp(26px, 5vw, 44px)', fontWeight: '900',
                    letterSpacing: '-1px', marginBottom: '14px', color: T.ink,
                }}>
                    Try it now. Free.
                </h2>
                <p style={{ color: T.ink3, marginBottom: '32px', fontSize: '15px', maxWidth: '340px', margin: '0 auto 32px' }}>
                    No sign up required. Just upload a photo and get clean text in seconds.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                    <Link href="/app" className="lp-btn-accent" style={{ textDecoration: 'none' }}>
                        Start transcribing <Ic.Arrow s={16} c="#fff" />
                    </Link>
                    <a
                        href={PLAY_STORE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ display: 'inline-block', lineHeight: 0 }}
                        aria-label="Get it on Google Play"
                    >
                        <img
                            src="/google-play-badge.png"
                            alt="Get it on Google Play"
                            style={{ height: '48px', width: 'auto', display: 'block' }}
                        />
                    </a>
                </div>
            </section>

            {/* ── FAQ ── */}
            <Section style={{ marginTop: '72px', marginBottom: '72px' }} id="faq">
                <h2 style={{
                    fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: '900',
                    letterSpacing: '-0.5px', marginBottom: '24px', color: T.ink,
                }}>
                    Frequently asked questions
                </h2>
                {FAQS.map((f, i) => <FAQItem key={i} q={f.q} a={f.a} />)}
            </Section>

            {/* ── Footer ── */}
            <footer style={{
                borderTop: `1px solid ${T.border}`,
                padding: '28px clamp(20px, 5vw, 56px)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                flexWrap: 'wrap', gap: '16px',
                fontSize: '12px', color: T.ink4, background: T.bg,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <Logo size={20} />
                    <span style={{ fontWeight: '700', color: T.ink3 }}>Inkto</span>
                    <span>&copy; {new Date().getFullYear()}</span>
                    <span>&middot;</span>
                    <span>Developed by <a href="mailto:hello@francisnaga.site" style={{ color: T.accent, textDecoration: 'none', fontWeight: 600 }}>Francis Naga</a></span>
                </div>

                <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <Link href="/terms.html" style={{ color: T.ink3, textDecoration: 'none' }}>Terms</Link>
                    <span>&middot;</span>
                    <Link href="/privacy.html" style={{ color: T.ink3, textDecoration: 'none' }}>Privacy</Link>
                    <span>&middot;</span>
                    <Link href="/accuracy.html" style={{ color: T.ink3, textDecoration: 'none' }}>AI Accuracy</Link>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer"
                        style={{ display: 'inline-block', lineHeight: 0 }}
                        aria-label="Get it on Google Play">
                        <img
                            src="/google-play-badge.png"
                            alt="Get it on Google Play"
                            style={{ height: '34px', width: 'auto', display: 'block' }}
                        />
                    </a>
                    <a href="https://paystack.shop/pay/4h04eqpye7" target="_blank" rel="noopener noreferrer"
                        style={{
                            color: T.ink2, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px',
                            fontWeight: '600', fontSize: '12px', border: `1px solid ${T.border}`,
                            padding: '5px 12px', borderRadius: '8px', background: T.surface,
                        }}>
                        <Ic.Paystack s={13} /> Tip NGN
                    </a>
                    <a href="https://paypal.me/frankyideal25" target="_blank" rel="noopener noreferrer"
                        style={{
                            color: T.ink2, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px',
                            fontWeight: '600', fontSize: '12px', border: `1px solid ${T.border}`,
                            padding: '5px 12px', borderRadius: '8px', background: T.surface,
                        }}>
                        <Ic.PayPal s={13} /> Tip USD
                    </a>
                    <a href="mailto:hello@francisnaga.site" title="Contact Developer (Francis Naga)" className="lp-footer-link"><Ic.Mail s={15} /></a>
                    <a href="https://x.com/inktotext" target="_blank" rel="noopener noreferrer" className="lp-footer-link"><Ic.Twitter s={15} /></a>
                    <a href="https://github.com/francisnaga" target="_blank" rel="noopener noreferrer" className="lp-footer-link"><Ic.Github s={15} /></a>
                </div>

                <span style={{ color: T.ink4, fontSize: '11px', flex: '1 1 100%', marginTop: '4px' }}>
                    Handwriting OCR &middot; Affidavit Transcription &middot; Legal Document Converter &middot; Scan to Word
                </span>
            </footer>
        </div>
    );
}
