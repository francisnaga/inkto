import React, { useState } from 'react';
import { ArrowRight, Check, Camera, FileText, Mail, Zap, Shield, Clock, ChevronDown } from 'lucide-react';

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
                <ChevronDown size={18} color="#94A3B8" style={{
                    flexShrink: 0,
                    transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease'
                }} />
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
    { icon: <Zap size={16} color="#2563EB" />, text: 'AI reads even messy handwriting' },
    { icon: <Check size={16} color="#2563EB" />, text: 'Crossed-out words removed automatically' },
    { icon: <FileText size={16} color="#2563EB" />, text: 'Exports to Word (.docx) or plain text' },
    { icon: <Mail size={16} color="#2563EB" />, text: 'Email to yourself or any address' },
    { icon: <Shield size={16} color="#2563EB" />, text: 'No account, no password, no tracking' },
    { icon: <Clock size={16} color="#2563EB" />, text: 'Results in under 60 seconds' },
];

const STEPS = [
    {
        n: '1',
        icon: <Camera size={20} color="#fff" />,
        title: 'Photograph the document',
        desc: 'Take a photo on your phone or upload a scanned PDF. Up to 30 pages at once. Works with affidavits, letters, notebooks — anything handwritten.'
    },
    {
        n: '2',
        icon: <Zap size={20} color="#fff" />,
        title: 'AI transcribes it',
        desc: 'Our AI reads the handwriting, strips crossed-out text, inserts caret additions in the right place, and formats everything cleanly. Two-pass verification catches numbers and names.'
    },
    {
        n: '3',
        icon: <FileText size={20} color="#fff" />,
        title: 'Copy, download, or email it',
        desc: 'Copy the text directly, download a Word document, or email the transcript to yourself. Open on any device — your history is one link away.'
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

            {/* ── Navbar ── */}
            <nav style={{
                position: 'sticky', top: 0, zIndex: 100,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '0 clamp(20px, 5vw, 60px)', height: '60px',
                background: 'rgba(250,250,248,0.9)',
                backdropFilter: 'blur(12px)',
                borderBottom: '1px solid rgba(0,0,0,0.06)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                    <img src="/icon-512.png" alt="" style={{ width: '26px', height: '26px', borderRadius: '7px' }} />
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

            {/* ── Hero ── */}
            <section style={{
                maxWidth: '720px', margin: '0 auto',
                padding: 'clamp(64px, 10vw, 100px) clamp(20px, 5vw, 40px) 56px',
                textAlign: 'center'
            }}>
                {/* Badge */}
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    background: '#EFF6FF', border: '1px solid #BFDBFE',
                    borderRadius: '99px', padding: '5px 14px',
                    fontSize: '12px', fontWeight: '700', color: '#2563EB',
                    letterSpacing: '0.02em', marginBottom: '28px',
                    textTransform: 'uppercase'
                }}>
                    <Zap size={11} /> AI Handwriting OCR
                </div>

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
                    Snap a photo of any handwritten document — affidavit, letter, or notes — and Inkto converts it to clean, editable text. Crossed-out words gone. Insertions in the right place.
                </p>

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
                        Start transcribing <ArrowRight size={16} />
                    </button>
                </div>

                <p style={{ marginTop: '16px', fontSize: '13px', color: '#94A3B8', fontWeight: '500' }}>
                    Free · No sign-up · Works in your browser
                </p>
            </section>

            {/* ── Feature pills ── */}
            <section style={{ maxWidth: '800px', margin: '0 auto', padding: '0 clamp(20px, 5vw, 40px) 80px' }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '10px'
                }}>
                    {FEATURES.map((f, i) => (
                        <div key={i} style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            background: '#fff', border: '1px solid #E2E8F0',
                            borderRadius: '10px', padding: '12px 16px',
                            fontSize: '13px', fontWeight: '600', color: '#374151'
                        }}>
                            {f.icon} {f.text}
                        </div>
                    ))}
                </div>
            </section>

            {/* ── App screenshot / hero visual ── */}
            <section style={{ maxWidth: '960px', margin: '0 auto 80px', padding: '0 clamp(20px, 5vw, 40px)' }}>
                <div style={{
                    borderRadius: '20px', overflow: 'hidden',
                    boxShadow: '0 24px 80px rgba(0,0,0,0.12)',
                    border: '1px solid #E2E8F0'
                }}>
                    <img src="/hero.jpg" alt="Inkto converting a handwritten legal document to clean text" style={{ width: '100%', display: 'block' }} />
                </div>
            </section>

            {/* ── How it works ── */}
            <section style={{
                maxWidth: '800px', margin: '0 auto 100px',
                padding: '0 clamp(20px, 5vw, 40px)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                    <h2 style={{ fontSize: 'clamp(26px, 4vw, 36px)', fontWeight: '900', letterSpacing: '-0.8px', color: '#0F172A', margin: '0 0 10px' }}>
                        From photo to text in three steps
                    </h2>
                    <p style={{ fontSize: '16px', color: '#64748B', margin: 0 }}>
                        No training, no setup. Just works.
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
                                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#94A3B8', letterSpacing: '0.08em' }}>STEP {s.n}</span>
                                    <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', margin: 0, letterSpacing: '-0.2px' }}>{s.title}</h3>
                                </div>
                                <p style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.65, margin: 0 }}>{s.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Email / cross-device callout ── */}
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
                        Transcribe on your phone.<br />Finish on your laptop.
                    </h2>
                    <p style={{ color: '#94A3B8', lineHeight: 1.7, fontSize: '15px', marginBottom: '28px', maxWidth: '480px' }}>
                        After transcribing, hit <strong style={{ color: '#fff' }}>Inbox</strong> — you'll get the Word file attached and a link in your email. Open that link on any device and your transcript is ready.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '380px' }}>
                        {[
                            'Word document (.docx) attached to every email',
                            'Secure session link — access from any device',
                            'Save to history with your email, retrieve anytime',
                            'No password ever — just a magic link'
                        ].map(t => (
                            <div key={t} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#38BDF8', flexShrink: 0, marginTop: '6px' }} />
                                <span style={{ fontSize: '14px', color: '#CBD5E1', lineHeight: 1.5 }}>{t}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Use cases ── */}
            <section style={{ maxWidth: '800px', margin: '0 auto 100px', padding: '0 clamp(20px, 5vw, 40px)' }}>
                <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 32px)', fontWeight: '900', letterSpacing: '-0.6px', textAlign: 'center', marginBottom: '36px', color: '#0F172A' }}>
                    Built for real work
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                    {[
                        { emoji: '⚖️', title: 'Legal documents', desc: 'Affidavits, sworn statements, court filings' },
                        { emoji: '🏥', title: 'Medical notes', desc: "Doctor's handwritten records and prescriptions" },
                        { emoji: '📚', title: 'Student notes', desc: 'Lecture notes, revision summaries' },
                        { emoji: '📋', title: 'Field reports', desc: 'Site surveys, inspection notes' },
                        { emoji: '✉️', title: 'Personal letters', desc: 'Correspondence, diaries, family documents' },
                        { emoji: '🧾', title: 'Forms & receipts', desc: 'Handwritten forms, invoices, records' },
                    ].map(u => (
                        <div key={u.title} style={{
                            background: '#fff', border: '1px solid #E2E8F0',
                            borderRadius: '14px', padding: '20px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                        }}>
                            <div style={{ fontSize: '24px', marginBottom: '10px' }}>{u.emoji}</div>
                            <div style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A', marginBottom: '4px' }}>{u.title}</div>
                            <div style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.5 }}>{u.desc}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Final CTA ── */}
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
                    No sign-up. No credit card. Just upload a photo and get clean text in under a minute.
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
                    Start transcribing <ArrowRight size={16} />
                </button>
            </section>

            {/* ── Social Proof / Ratings ── */}
            <section style={{ maxWidth: '800px', margin: '0 auto', padding: '0 clamp(20px, 5vw, 40px) 60px' }}>
                <div style={{
                    background: '#fff', border: '1px solid #E2E8F0', borderRadius: '16px',
                    padding: '24px 28px', display: 'flex', alignItems: 'center',
                    gap: '20px', flexWrap: 'wrap', boxShadow: '0 1px 4px rgba(0,0,0,0.03)'
                }}>
                    <div style={{ display: 'flex', gap: '3px', fontSize: '22px', color: '#F59E0B' }}>
                        {'★★★★★'}
                    </div>
                    <div>
                        <div style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A' }}>
                            Rated 4.9 / 5 by users
                        </div>
                        <div style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>
                            "Finally works on my handwritten affidavits" · "Saved me hours" · "Accurate even on messy handwriting"
                        </div>
                    </div>
                </div>
            </section>

            {/* ── FAQ ── */}
            <section style={{ maxWidth: '800px', margin: '0 auto 80px', padding: '0 clamp(20px, 5vw, 40px)' }} id="faq">
                <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 30px)', fontWeight: '900', letterSpacing: '-0.5px', marginBottom: '28px', color: '#0F172A' }}>
                    Frequently asked questions
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {[
                        {
                            q: 'How do I convert handwriting to text for free?',
                            a: 'Upload a photo or scanned PDF of your handwritten document to Inkto. Our AI reads the handwriting and returns clean, editable text in under 60 seconds — completely free, no sign-up needed.'
                        },
                        {
                            q: 'Can Inkto transcribe legal documents and affidavits?',
                            a: 'Yes. Inkto is specifically built for legal documents including affidavits, sworn statements, court filings, and other handwritten legal texts. It removes crossed-out words, correctly places caret insertions, and runs a second AI pass to verify numbers and proper nouns.'
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
                            a: 'Inkto uses a two-pass AI verification process. The first pass transcribes the handwriting. The second pass verifies numbers, dates, proper nouns, and legal terms against the original image for legal-grade accuracy.'
                        },
                        {
                            q: 'Is my document data private?',
                            a: 'Documents are processed securely and automatically deleted after 7 days. No account is required, and your documents are never used for training AI models.'
                        },
                    ].map((item, i) => (
                        <FAQItem key={i} q={item.q} a={item.a} />
                    ))}
                </div>
            </section>

            {/* ── Footer ── */}
            <footer style={{
                borderTop: '1px solid #E2E8F0',
                padding: '24px clamp(20px, 5vw, 60px)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                flexWrap: 'wrap', gap: '12px',
                fontSize: '13px', color: '#94A3B8', background: '#FAFAF8'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <img src="/icon-512.png" alt="" style={{ width: '20px', height: '20px', borderRadius: '5px' }} />
                    <span style={{ fontWeight: '700', color: '#64748B' }}>Inkto</span>
                    <span>© {new Date().getFullYear()}</span>
                </div>
                <div>
                    <span>Handwriting OCR · Affidavit Transcription · Legal Document Converter · Scan to Word</span>
                </div>
            </footer>
        </div>
    );
}
