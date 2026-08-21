import React, { useState } from 'react';

// Hardcoded SVGs to ensure they never fail to load on older Android devices
const IconArrowRight = ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
);
const IconCheck = ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
);
const IconCamera = ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
);
const IconFileText = ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
);
const IconMail = ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
);
const IconZap = ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
);
const IconShield = ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
);
const IconClock = ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
);
const IconChevronDown = ({ size = 16, color = 'currentColor', open }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}><path d="m6 9 6 6 6-6"/></svg>
);
const IconGithub = ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
);
const IconTwitter = ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
);
const IconCoffee = ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" y1="2" x2="6" y2="4"/><line x1="10" y1="2" x2="10" y2="4"/><line x1="14" y1="2" x2="14" y2="4"/></svg>
);

function FAQItem({ q, a }) {
    const [open, setOpen] = useState(false);
    return (
        <div style={{
            background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px',
            marginBottom: '8px', overflow: 'hidden'
        }}>
            <button
                onClick={() => setOpen(o => !o)}
                style={{
                    width: '100%', display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', gap: '12px',
                    padding: '18px 20px', background: 'none', border: 'none',
                    cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit'
                }}
            >
                <span style={{ fontSize: '15px', fontWeight: '700', color: '#0F172A', lineHeight: 1.4 }}>{q}</span>
                <IconChevronDown size={18} color="#94A3B8" open={open} />
            </button>
            {open && (
                <div style={{
                    padding: '0 20px 18px',
                    fontSize: '14px', color: '#64748B', lineHeight: 1.7
                }}>
                    {a}
                </div>
            )}
        </div>
    );
}

const FEATURES = [
    { icon: <IconZap size={16} color="#2563EB" />, text: 'Handles messy handwriting' },
    { icon: <IconCheck size={16} color="#2563EB" />, text: 'Crossed out words removed automatically' },
    { icon: <IconFileText size={16} color="#2563EB" />, text: 'Exports to Word (.docx) or plain text' },
    { icon: <IconMail size={16} color="#2563EB" />, text: 'Email directly to yourself or a colleague' },
    { icon: <IconShield size={16} color="#2563EB" />, text: 'No password required' },
    { icon: <IconClock size={16} color="#2563EB" />, text: 'Result in seconds' },
];

const STEPS = [
    {
        n: '1',
        icon: <IconCamera size={20} color="#fff" />,
        title: 'Photograph the document',
        desc: 'Take a photo on your phone or upload a scanned PDF. Process up to 30 pages at once. Specifically optimized for affidavits, sworn statements, and handwritten legal filings.'
    },
    {
        n: '2',
        icon: <IconZap size={20} color="#fff" />,
        title: 'Read and transcribe',
        desc: 'The system reads the handwriting, strips crossed out text, inserts caret additions in the correct place, and formats everything cleanly. Two pass verification catches numbers and proper nouns.'
    },
    {
        n: '3',
        icon: <IconFileText size={20} color="#fff" />,
        title: 'Copy, download, or email it',
        desc: 'Copy the text directly, download a Word document, or email the transcript to yourself. Your history is saved to your email inbox and available indefinitely as long as you log in with that same email.'
    },
];

export default function LandingPage({ onGetStarted }) {
    const [hoverCta, setHoverCta] = useState(false);

    return (
        <div style={{
            minHeight: '100vh',
            background: '#FAFAF8',
            fontFamily: "'Inter', -apple-system, sans-serif",
            color: '#1C1917'
        }}>
            <style>
                {`
                @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@600&display=swap');
                
                @media (max-width: 768px) {
                    .hero-visual-arrow { transform: rotate(90deg); margin: 10px 0; }
                    .hero-visual-container { flex-direction: column; }
                }
                @media (min-width: 769px) {
                    .hero-visual-arrow { transform: none; }
                    .hero-visual-container { flex-direction: row; }
                }
                `}
            </style>

            {/* Navbar */}
            <nav style={{
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
                boxSizing: 'border-box',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '0 clamp(20px, 5vw, 60px)', height: '60px',
                background: 'rgba(250,250,248,0.9)',
                backdropFilter: 'blur(12px)',
                borderBottom: '1px solid rgba(0,0,0,0.06)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                    <svg width="28" height="28" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M16 50 L36 28 L54 38 L54 62 L36 72 Z" fill="#2563EB"/>
                        <circle cx="30" cy="50" r="3.5" fill="white"/>
                        <line x1="16" y1="50" x2="36" y2="50" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                        <line x1="36" y1="28" x2="36" y2="72" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                        <rect x="57" y="30" width="28" height="7" rx="3.5" fill="#2563EB"/>
                        <rect x="57" y="46.5" width="26" height="7" rx="3.5" fill="#2563EB"/>
                        <rect x="57" y="63" width="20" height="7" rx="3.5" fill="#2563EB"/>
                    </svg>
                    <span style={{ fontWeight: 800, fontSize: '17px', letterSpacing: '-0.4px' }}>Inkto</span>
                </div>
                <button
                    onClick={onGetStarted}
                    style={{
                        padding: '9px 20px', background: '#1C1917', color: '#fff',
                        border: 'none', borderRadius: '9px', fontSize: '14px', fontWeight: '700',
                        cursor: 'pointer', letterSpacing: '-0.1px', transition: 'opacity 0.15s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                    Try it free
                </button>
            </nav>

            {/* Hero */}
            <section style={{
                maxWidth: '900px', margin: '0 auto',
                padding: 'clamp(124px, 15vw, 140px) clamp(20px, 5vw, 40px) 56px',
                textAlign: 'center'
            }}>
                <h1 style={{
                    fontSize: 'clamp(36px, 7vw, 64px)',
                    fontWeight: 900, lineHeight: 1.05,
                    letterSpacing: '-2px', color: '#0F172A',
                    marginBottom: '24px'
                }}>
                    Handwritten docs,<br />
                    <span style={{
                        background: 'linear-gradient(135deg, #2563EB, #0EA5E9)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                    }}>
                        typed in seconds.
                    </span>
                </h1>

                <p style={{
                    fontSize: 'clamp(16px, 2.5vw, 19px)', color: '#64748B',
                    maxWidth: '520px', margin: '0 auto 40px',
                    lineHeight: 1.65, fontWeight: 400
                }}>
                    Snap a photo of any handwritten document and Inkto converts it to clean, editable text.
                </p>

                {/* Hero Visual Demo */}
                <div className="hero-visual-container" style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px',
                    margin: '0 auto 48px', maxWidth: '860px'
                }}>
                    {/* Before */}
                    <div style={{
                        flex: '1 1 320px', borderRadius: '16px', overflow: 'hidden',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.12)', border: '1px solid #E4E2DC',
                        position: 'relative'
                    }}>
                        <div style={{
                            position: 'absolute', top: '10px', left: '10px', zIndex: 2,
                            background: 'rgba(0,0,0,0.55)', color: '#fff',
                            fontSize: '11px', fontWeight: '700', padding: '4px 10px',
                            borderRadius: '99px', letterSpacing: '0.06em', backdropFilter: 'blur(4px)'
                        }}>BEFORE</div>
                        <img src="/handwriting_before.jpg" alt="Handwritten affidavit with crossed-out words"
                            style={{ width: '100%', display: 'block', objectFit: 'cover', aspectRatio: '4/3' }} />
                    </div>

                    {/* Arrow */}
                    <div className="hero-visual-arrow" style={{ color: '#94A3B8', flexShrink: 0 }}>
                        <IconArrowRight size={28} />
                    </div>

                    {/* After */}
                    <div style={{
                        flex: '1 1 320px', background: '#fff', border: '1px solid #E2E8F0',
                        borderRadius: '16px', padding: '28px 28px', boxShadow: '0 12px 40px rgba(0,0,0,0.08)',
                        textAlign: 'left', position: 'relative'
                    }}>
                        <div style={{
                            position: 'absolute', top: '10px', left: '10px',
                            background: 'rgba(37,99,235,0.1)', color: '#2563EB',
                            fontSize: '11px', fontWeight: '700', padding: '4px 10px',
                            borderRadius: '99px', letterSpacing: '0.06em'
                        }}>AFTER</div>
                        <div style={{
                            fontFamily: "'EB Garamond', Georgia, serif", fontSize: '20px', color: '#0F172A',
                            lineHeight: 1.7, marginTop: '28px'
                        }}>
                            I hereby swear that the claimant was present at the scene on the 14th of March 2024. The said individual did not leave the premises before 6pm.
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button
                        onClick={onGetStarted}
                        onMouseEnter={() => setHoverCta(true)}
                        onMouseLeave={() => setHoverCta(false)}
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: '8px',
                            padding: '16px 32px', background: '#1C1917', color: '#fff',
                            border: 'none', borderRadius: '12px',
                            fontSize: '16px', fontWeight: '800', cursor: 'pointer',
                            letterSpacing: '-0.2px',
                            boxShadow: hoverCta ? '0 12px 32px rgba(0,0,0,0.28)' : '0 6px 20px rgba(0,0,0,0.18)',
                            transform: hoverCta ? 'translateY(-2px)' : 'translateY(0)',
                            transition: 'all 0.18s cubic-bezier(0.4,0,0.2,1)'
                        }}
                    >
                        Start transcribing <IconArrowRight size={16} />
                    </button>
                </div>

                <p style={{ marginTop: '16px', fontSize: '13px', color: '#94A3B8', fontWeight: '500' }}>
                    Free. No sign up required. Works directly in your browser.
                </p>
            </section>

            {/* Features (Mixed Layout) */}
            <section style={{ maxWidth: '960px', margin: '0 auto 80px', padding: '0 clamp(20px, 5vw, 40px)' }}>
                {/* Top Demos */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '24px' }}>
                    {/* Card A: Edits */}
                    <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '32px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 20px', color: '#0F172A', letterSpacing: '-0.3px' }}>Understands edits, not just characters</h3>
                        <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #E4E2DC', marginBottom: '16px', position: 'relative' }}>
                            <div style={{
                                position: 'absolute', top: '8px', left: '8px',
                                background: 'rgba(0,0,0,0.5)', color: '#fff',
                                fontSize: '10px', fontWeight: '700', padding: '3px 8px',
                                borderRadius: '99px', zIndex: 1, backdropFilter: 'blur(4px)'
                            }}>HANDWRITTEN INPUT</div>
                            <img src="/handwriting_edits.jpg" alt="Handwritten text with crossed-out word" style={{ width: '100%', display: 'block', objectFit: 'cover', height: '140px' }} />
                        </div>
                        <div style={{ background: '#F8FAFC', padding: '16px 20px', borderRadius: '12px', border: '1px solid #E2E8F0', fontFamily: "'EB Garamond', Georgia, serif", fontSize: '19px', color: '#0F172A', position: 'relative' }}>
                            <div style={{
                                position: 'absolute', top: '-10px', right: '14px',
                                background: '#EFF6FF', color: '#2563EB',
                                fontSize: '10px', fontWeight: '700', padding: '3px 8px',
                                borderRadius: '99px'
                            }}>CLEAN OUTPUT</div>
                            keep this
                        </div>
                    </div>

                    {/* Card B: Structure */}
                    <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '32px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 20px', color: '#0F172A', letterSpacing: '-0.3px' }}>Preserves document structure</h3>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                            <div style={{ flex: 1, borderRadius: '12px', overflow: 'hidden', border: '1px solid #E4E2DC', position: 'relative' }}>
                                <div style={{
                                    position: 'absolute', top: '8px', left: '8px',
                                    background: 'rgba(0,0,0,0.5)', color: '#fff',
                                    fontSize: '10px', fontWeight: '700', padding: '3px 8px',
                                    borderRadius: '99px', zIndex: 1, backdropFilter: 'blur(4px)'
                                }}>INPUT</div>
                                <img src="/handwriting_list.jpg" alt="Handwritten numbered list" style={{ width: '100%', display: 'block', objectFit: 'cover', height: '170px', objectPosition: 'top' }} />
                            </div>
                            <div style={{ flexShrink: 0 }}>
                                <IconArrowRight size={16} color="#94A3B8" />
                            </div>
                            <div style={{ flex: 1, background: '#F8FAFC', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0', fontFamily: "'EB Garamond', Georgia, serif", fontSize: '16px', color: '#0F172A', lineHeight: 1.5, position: 'relative' }}>
                                <div style={{
                                    position: 'absolute', top: '-10px', right: '10px',
                                    background: '#EFF6FF', color: '#2563EB',
                                    fontSize: '10px', fontWeight: '700', padding: '3px 8px',
                                    borderRadius: '99px'
                                }}>OUTPUT</div>
                                <ol style={{ margin: 0, paddingLeft: '18px' }}>
                                    <li style={{ marginBottom: '6px' }}>Exhibit A &mdash; sworn statement</li>
                                    <li style={{ marginBottom: '6px' }}>Exhibit B &mdash; court notice</li>
                                    <li>Exhibit C &mdash; police report</li>
                                </ol>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Standard Features */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                    {FEATURES.slice(2).map((f, i) => (
                        <div key={i} style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            background: '#fff', border: '1px solid #E2E8F0',
                            borderRadius: '10px', padding: '14px 18px',
                            fontSize: '13px', fontWeight: '600', color: '#374151'
                        }}>
                            {f.icon} {f.text}
                        </div>
                    ))}
                </div>
            </section>

            {/* How it works */}
            <section style={{
                maxWidth: '800px', margin: '0 auto 100px',
                padding: '0 clamp(20px, 5vw, 40px)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                    <h2 style={{ fontSize: 'clamp(26px, 4vw, 36px)', fontWeight: '900', letterSpacing: '-0.8px', color: '#0F172A', margin: '0 0 10px' }}>
                        From photo to text in three steps
                    </h2>
                    <p style={{ fontSize: '16px', color: '#64748B', margin: 0 }}>
                        No complex setup or training required.
                    </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {STEPS.map((s, i) => (
                        <div key={i} style={{
                            display: 'flex', gap: '20px', alignItems: 'flex-start',
                            background: '#fff', border: '1px solid #E2E8F0',
                            borderRadius: '16px', padding: '24px 28px',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.03)'
                        }}>
                            <div style={{
                                width: '44px', height: '44px', borderRadius: '12px',
                                background: '#1C1917',
                                display: 'flex', alignItems: 'center',
                                justifyContent: 'center', flexShrink: 0
                            }}>
                                {s.icon}
                            </div>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#94A3B8', letterSpacing: '0.08em' }}>{s.n}</span>
                                    <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', margin: 0, letterSpacing: '-0.2px' }}>{s.title}</h3>
                                </div>
                                <p style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.65, margin: 0 }}>{s.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Email / cross-device callout */}
            <section style={{ maxWidth: '800px', margin: '0 auto 100px', padding: '0 clamp(20px, 5vw, 40px)' }}>
                <div style={{
                    background: '#0F172A', borderRadius: '20px',
                    padding: 'clamp(32px, 5vw, 52px) clamp(28px, 5vw, 52px)', color: '#fff',
                }}>
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
                        {['📱 Scan on phone', '💻 Edit on laptop', '📂 Save to history'].map(t => (
                            <span key={t} style={{
                                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
                                borderRadius: '99px', padding: '5px 14px',
                                fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.7)'
                            }}>{t}</span>
                        ))}
                    </div>
                    <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 32px)', fontWeight: '900', letterSpacing: '-0.6px', marginBottom: '14px', lineHeight: 1.2 }}>
                        Transcribe on your phone.<br />Save to your history.
                    </h2>
                    <p style={{ color: '#94A3B8', lineHeight: 1.7, fontSize: '15px', marginBottom: '28px', maxWidth: '480px' }}>
                        After transcribing, use the <strong style={{ color: '#fff' }}>Inbox</strong> feature. You will get the Word file attached directly in your email along with a secure login link. Clicking this link saves your document to your history indefinitely so you can reference or edit it anytime.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '380px' }}>
                        {[
                            'Word document (.docx) attached to your email',
                            'Secure session link provides access from any device',
                            'Documents are saved to your email history indefinitely',
                            'No passwords required to log in'
                        ].map(t => (
                            <div key={t} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#38BDF8', flexShrink: 0, marginTop: '6px' }} />
                                <span style={{ fontSize: '14px', color: '#CBD5E1', lineHeight: 1.5 }}>{t}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section style={{
                textAlign: 'center',
                padding: 'clamp(60px, 8vw, 100px) clamp(20px, 5vw, 40px)',
                background: '#fff',
                borderTop: '1px solid #E2E8F0'
            }}>
                <h2 style={{ fontSize: 'clamp(28px, 5vw, 46px)', fontWeight: '900', letterSpacing: '-1px', marginBottom: '14px', color: '#0F172A' }}>
                    Try it now. Free.
                </h2>
                <p style={{ color: '#64748B', marginBottom: '32px', fontSize: '16px', maxWidth: '360px', margin: '0 auto 32px' }}>
                    No sign up required. Just upload a photo and get clean text in seconds.
                </p>
                <button
                    onClick={onGetStarted}
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                        padding: '16px 36px', background: '#2563EB', color: '#fff',
                        border: 'none', borderRadius: '12px',
                        fontSize: '16px', fontWeight: '800', cursor: 'pointer',
                        letterSpacing: '-0.2px',
                        boxShadow: '0 6px 24px rgba(37,99,235,0.35)',
                        transition: 'all 0.18s'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 36px rgba(37,99,235,0.45)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(37,99,235,0.35)'; }}
                >
                    Start transcribing <IconArrowRight size={16} />
                </button>
            </section>

            {/* FAQ */}
            <section style={{ maxWidth: '800px', margin: '0 auto 80px', padding: '0 clamp(20px, 5vw, 40px)' }} id="faq">
                <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 30px)', fontWeight: '900', letterSpacing: '-0.5px', marginBottom: '28px', color: '#0F172A' }}>
                    Frequently asked questions
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {[
                        {
                            q: 'How do I convert handwriting to text for free?',
                            a: 'Upload a photo or scanned PDF of your handwritten document to Inkto. The system reads the handwriting and returns clean, editable text in seconds. Completely free and no sign up is required.'
                        },
                        {
                            q: 'Can Inkto transcribe legal documents and affidavits?',
                            a: 'Yes. Inkto is specifically built for legal documents including affidavits, sworn statements, court filings, and other handwritten legal texts. It removes crossed out words, correctly places caret insertions, and runs a second pass to verify numbers and proper nouns.'
                        },
                        {
                            q: 'What file formats does Inkto accept?',
                            a: 'Inkto accepts JPEG, PNG, and PDF files. You can upload up to 30 pages at once. Output can be copied as plain text or downloaded as a Microsoft Word (.docx) file.'
                        },
                        {
                            q: 'Does Inkto work on mobile phones?',
                            a: 'Yes. Inkto works in any mobile browser on Android and iPhone. Take a photo directly with your camera and upload it. You can also add Inkto to your home screen for quick access like a native app.'
                        },
                        {
                            q: 'How accurate is the handwriting recognition?',
                            a: 'Inkto uses a two pass verification process. The first pass transcribes the handwriting. The second pass verifies numbers, dates, proper nouns, and legal terms against the original image for legal grade accuracy.'
                        },
                        {
                            q: 'Is my document data private?',
                            a: 'Documents are processed securely and automatically deleted after 7 days. No account is required, and your documents are never used for training models.'
                        },
                    ].map((item, i) => (
                        <FAQItem key={i} q={item.q} a={item.a} />
                    ))}
                </div>
            </section>

            {/* Footer */}
            <footer style={{
                borderTop: '1px solid #E2E8F0',
                padding: '24px clamp(20px, 5vw, 60px)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                flexWrap: 'wrap', gap: '12px',
                fontSize: '13px', color: '#94A3B8', background: '#FAFAF8'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="20" height="20" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M16 50 L36 28 L54 38 L54 62 L36 72 Z" fill="#2563EB"/>
                        <circle cx="30" cy="50" r="3.5" fill="white"/>
                        <line x1="16" y1="50" x2="36" y2="50" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                        <line x1="36" y1="28" x2="36" y2="72" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                        <rect x="57" y="30" width="28" height="7" rx="3.5" fill="#2563EB"/>
                        <rect x="57" y="46.5" width="26" height="7" rx="3.5" fill="#2563EB"/>
                        <rect x="57" y="63" width="20" height="7" rx="3.5" fill="#2563EB"/>
                    </svg>
                    <span style={{ fontWeight: '700', color: '#64748B' }}>Inkto</span>
                    <span>© {new Date().getFullYear()}</span>
                </div>
                <div style={{ flex: '1 1 100%', marginBottom: '4px' }}>
                    <span>Handwriting OCR · Affidavit Transcription · Legal Document Converter · Scan to Word</span>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <a href="https://paystack.shop/pay/4h04eqpye7" target="_blank" rel="noopener noreferrer" style={{
                        color: '#475569', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px',
                        fontWeight: '600', fontSize: '12px', border: '1px solid #E2E8F0',
                        padding: '5px 12px', borderRadius: '8px', transition: 'color 0.15s'
                    }}>
                        <IconCoffee size={13} /> Tip NGN
                    </a>
                    <a href="https://paypal.me/frankyideal25" target="_blank" rel="noopener noreferrer" style={{
                        color: '#475569', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px',
                        fontWeight: '600', fontSize: '12px', border: '1px solid #E2E8F0',
                        padding: '5px 12px', borderRadius: '8px', transition: 'color 0.15s'
                    }}>
                        <IconCoffee size={13} /> Tip USD
                    </a>
                    <a href="mailto:efobifrancis53@gmail.com" style={{ color: '#94A3B8', display: 'flex', alignItems: 'center' }} title="Contact">
                        <IconMail size={16} />
                    </a>
                    <a href="https://x.com/inktotext" target="_blank" rel="noopener noreferrer" style={{ color: '#94A3B8', display: 'flex', alignItems: 'center' }}>
                        <IconTwitter size={16} />
                    </a>
                    <a href="https://github.com/francisnaga" target="_blank" rel="noopener noreferrer" style={{ color: '#94A3B8', display: 'flex', alignItems: 'center' }}>
                        <IconGithub size={16} />
                    </a>
                </div>
            </footer>
        </div>
    );
}
