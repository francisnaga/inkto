'use client';

import { useState } from 'react';
import Link from 'next/link';
import { InktoWordmark } from '@/components/inkto-logo';

/* ── Design tokens — exact values per Inkto spec ────────────────────────────*/
const C = {
  paper:   '#FBFAF7',
  border:  '#E4E1D9',
  ink:     '#0B0D12',
  inkMid:  '#444240',
  inkMute: '#6B6760',
  blue:    '#24467A',
  blueMid: '#3A5C94',
  brass:   '#A6822C',
  brassS:  '#F8F2E6',
  red:     '#B23A34',
  warmMid: '#C8C4BA',
  surface: '#FFFFFF',
};
const DISPLAY = 'Georgia, "Iowan Old Style", "Times New Roman", serif';
const UI      = '-apple-system, "Segoe UI", Roboto, sans-serif';

/* ── SVG icons ───────────────────────────────────────────────────────────── */
const Arrow  = () => <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>;
const Chevron = ({ open }: { open: boolean }) => <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={C.warmMid} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 200ms ease' }}><path d="m6 9 6 6 6-6"/></svg>;
const GhIc   = () => <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>;
const TwIc   = () => <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>;
const MlIc   = () => <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>;

/* ── FAQ accordion ───────────────────────────────────────────────────────── */
function FAQ({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '17px 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: UI }}
      >
        <span style={{ fontSize: 15, fontWeight: 600, color: C.inkMid, lineHeight: 1.4 }}>{q}</span>
        <Chevron open={open} />
      </button>
      {open && <p style={{ margin: '0 0 14px', fontSize: 14, color: C.inkMute, lineHeight: 1.75 }}>{a}</p>}
      <div style={{ height: 1, background: C.border }} />
    </div>
  );
}

const FEATURES = ['Exports to Word (.docx)', 'Email to yourself or colleague', 'No password required', 'Result in seconds'];
const STEPS = [
  { n: '01', title: 'Photograph the document', body: 'Take a photo on your phone or upload a scanned PDF. Handles up to 30 pages at once — optimised for affidavits, sworn statements, and handwritten legal filings.' },
  { n: '02', title: 'Read and transcribe',     body: 'The system reads the handwriting, strips crossed-out text, inserts caret additions correctly, and formats everything cleanly. A second AI pass verifies numbers and proper nouns.' },
  { n: '03', title: 'Copy, download, or email', body: 'Copy the text directly, download a Word document, or email the transcript. History is saved to your email and available indefinitely.' },
];
const FAQS = [
  { q: 'How do I convert handwriting to text for free?', a: 'Upload a photo or scanned PDF of your handwritten document to Inkto. The system reads the handwriting and returns clean, editable text in seconds. Completely free — no sign up required.' },
  { q: 'Can Inkto transcribe legal documents and affidavits?', a: 'Yes. Inkto is built for legal documents including affidavits, sworn statements, court filings, and other handwritten legal texts. It removes crossed-out words, places caret insertions correctly, and runs a second pass to verify numbers and proper nouns.' },
  { q: 'What file formats does Inkto accept?', a: 'Inkto accepts JPEG, PNG, and PDF files. You can upload up to 30 pages at once. Output can be copied as plain text or downloaded as a Microsoft Word (.docx) file.' },
  { q: 'Does Inkto work on mobile phones?', a: 'Yes. Inkto works in any mobile browser on Android and iPhone. Take a photo directly with your camera and upload it. You can also add Inkto to your home screen for quick access like a native app.' },
  { q: 'How accurate is the handwriting recognition?', a: 'Inkto uses a two-pass verification process. The first pass transcribes the handwriting. The second pass verifies numbers, dates, proper nouns, and legal terms against the original image for legal-grade accuracy.' },
  { q: 'Is my document data private?', a: 'Yes. Unsaved documents are automatically deleted after 7 days. Documents you save or email are kept securely in your history. No account is required, and your documents are never used for training models.' },
];

/* ── Button variants ────────────────────────────────────────────────────── */
function BtnPrimary({ children, href, style: s }: { children: React.ReactNode; href?: string; style?: React.CSSProperties }) {
  const base: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '13px 26px',
    background: C.blue, color: '#fff', border: 'none',
    borderRadius: 6, fontSize: 14, fontWeight: 700,
    cursor: 'pointer', fontFamily: UI, letterSpacing: '0.01em',
    textDecoration: 'none', ...s,
  };
  return href
    ? <Link href={href} style={base}>{children}</Link>
    : <button style={base}>{children}</button>;
}

/* ── Landing Page ─────────────────────────────────────────────────────────*/
export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', background: C.paper, fontFamily: UI, color: C.ink }}>

      {/* ── Navbar ────────────────────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0 clamp(20px,5vw,56px)', height: 56,
        background: `${C.paper}e8`,   /* ~91% opacity — no blur, just a tinted bar */
        borderBottom: `1px solid ${C.border}`,
      }}>
        <InktoWordmark size={24} />
        <BtnPrimary href="/app" style={{ padding: '8px 18px', fontSize: 13 }}>
          Try it free
        </BtnPrimary>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 860, margin: '0 auto', padding: 'clamp(100px,12vw,128px) clamp(20px,5vw,48px) 72px', textAlign: 'center' }}>
        {/* Badge */}
        <span style={{
          display: 'inline-block', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
          padding: '4px 14px', borderRadius: 99,
          background: C.brassS, color: C.brass,
          marginBottom: 24,
          textTransform: 'uppercase',
          border: `1px solid ${C.brass}40`,
        }}>
          For Legal Professionals
        </span>

        <h1 style={{
          fontFamily: DISPLAY,
          fontSize: 'clamp(36px,6vw,60px)',
          fontWeight: 700,
          lineHeight: 1.08,
          letterSpacing: '-0.03em',
          color: C.ink,
          marginBottom: 22,
        }}>
          Handwritten documents,<br />typed in seconds.
        </h1>

        <p style={{ fontSize: 'clamp(15px,2vw,17px)', color: C.inkMute, maxWidth: 440, margin: '0 auto 40px', lineHeight: 1.7 }}>
          Snap a photo of any handwritten document and Inkto converts it to clean, editable text — built for affidavits, sworn statements, and legal filings.
        </p>

        {/* Before/After — letterhead card, no heavy shadow */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 20, maxWidth: 760, margin: '0 auto 44px' }}>
          <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden', position: 'relative' }}>
            <span style={{ position: 'absolute', top: 10, left: 10, fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', color: C.warmMid, textTransform: 'uppercase' }}>Before</span>
            <div style={{ aspectRatio: '4/3', background: '#EDEAE3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 12, color: C.inkMute, fontStyle: 'italic' }}>Handwritten affidavit</span>
            </div>
          </div>

          <div style={{ color: C.warmMid, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Arrow />
          </div>

          <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, background: C.surface, padding: 24, aspectRatio: '4/3', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative' }}>
            <span style={{ position: 'absolute', top: 10, left: 10, fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', color: C.blue, textTransform: 'uppercase' }}>After</span>
            <p style={{ fontFamily: DISPLAY, fontSize: 'clamp(14px,1.6vw,17px)', color: C.ink, lineHeight: 1.75, margin: 0 }}>
              I hereby swear that the claimant was present at the scene on the 14th of March 2024. The said individual did not leave the premises before 6pm.
            </p>
          </div>
        </div>

        <BtnPrimary href="/app">
          Start transcribing <Arrow />
        </BtnPrimary>
        <p style={{ marginTop: 12, fontSize: 12, color: C.warmMid }}>Free. No sign up required. Works in your browser.</p>
      </section>

      {/* ── Thin section rule ───────────────────────────────────────────── */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 clamp(20px,5vw,48px)' }}>
        <div style={{ height: 1, background: C.border }} />
      </div>

      {/* ── Features strip ──────────────────────────────────────────────── */}
      <section style={{ maxWidth: 900, margin: '0 auto', padding: '64px clamp(20px,5vw,48px)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 32px' }}>
          {FEATURES.map(f => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: C.inkMid }}>
              <span style={{ color: C.blue, fontWeight: 700 }}>✓</span>
              {f}
            </div>
          ))}
        </div>

        <div style={{ height: 1, background: C.border, margin: '40px 0' }} />

        {/* Feature callouts — two columns */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 32 }}>
          <div>
            <h3 style={{ fontFamily: DISPLAY, fontSize: 18, fontWeight: 700, color: C.ink, margin: '0 0 12px', letterSpacing: '-0.02em' }}>
              Understands edits, not just characters
            </h3>
            <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, height: 100, background: '#EDEAE3', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 22, color: C.inkMute, textDecoration: 'line-through', fontFamily: DISPLAY }}>remove this</span>
            </div>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '12px 16px', fontFamily: DISPLAY, fontSize: 16, color: C.ink }}>
              keep this
            </div>
          </div>
          <div>
            <h3 style={{ fontFamily: DISPLAY, fontSize: 18, fontWeight: 700, color: C.ink, margin: '0 0 12px', letterSpacing: '-0.02em' }}>
              Preserves document structure
            </h3>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <div style={{ flex: 1, border: `1px solid ${C.border}`, borderRadius: 8, background: '#EDEAE3', padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {['1. First item', '2. Second item', '3. Third item'].map(t => <span key={t} style={{ fontSize: 12, color: C.inkMute, fontFamily: DISPLAY }}>{t}</span>)}
              </div>
              <span style={{ color: C.warmMid }}><Arrow /></span>
              <div style={{ flex: 1, border: `1px solid ${C.border}`, borderRadius: 8, background: C.surface, padding: '16px 14px', fontFamily: DISPLAY, fontSize: 13, color: C.ink, lineHeight: 1.6 }}>
                <ol style={{ margin: 0, paddingLeft: 16 }}>
                  <li style={{ marginBottom: 4 }}>Exhibit A — sworn statement</li>
                  <li style={{ marginBottom: 4 }}>Exhibit B — court notice</li>
                  <li>Exhibit C — police report</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 clamp(20px,5vw,48px)' }}>
        <div style={{ height: 1, background: C.border }} />
      </div>

      {/* ── How it works ────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 900, margin: '0 auto', padding: '64px clamp(20px,5vw,48px)' }}>
        <h2 style={{ fontFamily: DISPLAY, fontSize: 'clamp(22px,3.5vw,32px)', fontWeight: 700, color: C.ink, margin: '0 0 8px', letterSpacing: '-0.02em' }}>
          From photo to text in three steps
        </h2>
        <p style={{ fontSize: 14, color: C.inkMute, margin: '0 0 36px' }}>No complex setup or training required.</p>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {STEPS.map((s, i) => (
            <div key={i}>
              {i > 0 && <div style={{ height: 1, background: C.border }} />}
              <div style={{ display: 'flex', gap: 20, padding: '24px 0', alignItems: 'flex-start' }}>
                <span style={{ fontFamily: 'ui-monospace, "SF Mono", Consolas, monospace', fontSize: 12, fontWeight: 700, color: C.warmMid, letterSpacing: '0.05em', flexShrink: 0, paddingTop: 3 }}>
                  {s.n}
                </span>
                <div>
                  <h3 style={{ fontFamily: DISPLAY, fontSize: 16, fontWeight: 700, color: C.ink, margin: '0 0 8px', letterSpacing: '-0.01em' }}>{s.title}</h3>
                  <p style={{ fontSize: 14, color: C.inkMute, lineHeight: 1.75, margin: 0 }}>{s.body}</p>
                </div>
              </div>
            </div>
          ))}
          <div style={{ height: 1, background: C.border }} />
        </div>
      </section>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 clamp(20px,5vw,48px)' }}>
        <div style={{ height: 1, background: C.border }} />
      </div>

      {/* ── Cross-device — Ink Black bar, restrained ──────────────────── */}
      <section style={{ maxWidth: 900, margin: '0 auto', padding: '64px clamp(20px,5vw,48px)' }}>
        <div style={{ background: C.ink, borderRadius: 10, padding: 'clamp(32px,5vw,48px)' }}>
          <h2 style={{ fontFamily: DISPLAY, fontSize: 'clamp(20px,3vw,28px)', fontWeight: 700, color: '#fff', margin: '0 0 12px', letterSpacing: '-0.02em', lineHeight: 1.25 }}>
            Transcribe on your phone.<br />Edit on your laptop.
          </h2>
          <p style={{ fontSize: 14, color: '#888580', lineHeight: 1.75, margin: '0 0 24px', maxWidth: 440 }}>
            After transcribing, you get a Word file attached directly to your email. Log in at any time to access your full document history from any device.
          </p>
          <div style={{ height: 1, background: 'rgba(255,255,255,0.10)', marginBottom: 24 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {['Word document (.docx) attached to your email', 'Secure session link accessible from any device', 'Saved documents kept indefinitely in your history', 'No passwords required to log in'].map(t => (
              <div key={t} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <span style={{ color: C.brass, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✓</span>
                <span style={{ fontSize: 14, color: '#B0ADA8', lineHeight: 1.55 }}>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 clamp(20px,5vw,48px)' }}>
        <div style={{ height: 1, background: C.border }} />
      </div>

      {/* ── Final CTA ─────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 900, margin: '0 auto', padding: '64px clamp(20px,5vw,48px)', textAlign: 'center' }}>
        <h2 style={{ fontFamily: DISPLAY, fontSize: 'clamp(24px,4vw,40px)', fontWeight: 700, color: C.ink, margin: '0 0 12px', letterSpacing: '-0.02em' }}>
          Try it now. Free.
        </h2>
        <p style={{ fontSize: 15, color: C.inkMute, margin: '0 auto 32px', maxWidth: 320, lineHeight: 1.6 }}>
          No sign up required. Upload a photo and get clean text in seconds.
        </p>
        {/*
          Seal Brass as the one secondary-accent CTA hover state on this page.
          Primary state is Ink Blue; hover shifts to Brass — exactly one moment of warmth.
        */}
        <Link href="/app">
          <button
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '13px 28px',
              background: C.blue, color: '#fff',
              border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 700,
              cursor: 'pointer', fontFamily: UI, transition: 'background 200ms ease',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = C.brass; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = C.blue; }}
          >
            Start transcribing <Arrow />
          </button>
        </Link>
      </section>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 clamp(20px,5vw,48px)' }}>
        <div style={{ height: 1, background: C.border }} />
      </div>

      {/* ── FAQ ──────────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 900, margin: '0 auto', padding: '64px clamp(20px,5vw,48px)' }}>
        <h2 style={{ fontFamily: DISPLAY, fontSize: 'clamp(20px,3vw,26px)', fontWeight: 700, color: C.ink, margin: '0 0 4px', letterSpacing: '-0.02em' }}>
          Frequently asked questions
        </h2>
        <div style={{ height: 1, background: C.border, margin: '20px 0 4px' }} />
        {FAQS.map((f, i) => <FAQ key={i} q={f.q} a={f.a} />)}
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer style={{ borderTop: `1px solid ${C.border}`, padding: '24px clamp(20px,5vw,56px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, fontFamily: UI }}>
        <div>
          <InktoWordmark size={18} />
          <p style={{ fontSize: 11, color: C.warmMid, margin: '6px 0 0' }}>
            Handwriting OCR · Affidavit Transcription · Legal Document Converter · Scan to Word
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <a href="https://paystack.shop/pay/4h04eqpye7" target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontWeight: 600, color: C.inkMid, textDecoration: 'none', border: `1px solid ${C.border}`, padding: '5px 12px', borderRadius: 6 }}>Tip NGN</a>
          <a href="https://paypal.me/frankyideal25" target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontWeight: 600, color: C.inkMid, textDecoration: 'none', border: `1px solid ${C.border}`, padding: '5px 12px', borderRadius: 6 }}>Tip USD</a>
          <a href="mailto:efobifrancis53@gmail.com" style={{ color: C.warmMid, display: 'flex' }}><MlIc /></a>
          <a href="https://x.com/inktotext" target="_blank" rel="noopener noreferrer" style={{ color: C.warmMid, display: 'flex' }}><TwIc /></a>
          <a href="https://github.com/francisnaga" target="_blank" rel="noopener noreferrer" style={{ color: C.warmMid, display: 'flex' }}><GhIc /></a>
        </div>
      </footer>
    </div>
  );
}
