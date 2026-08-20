import React from 'react';
import { Scale, Mail, Monitor, FileText, CheckCircle, ArrowRight, Zap, Shield } from 'lucide-react';

const FEATURES = [
  {
    icon: <FileText size={22} color="#1D4ED8" />,
    title: 'Court Documents & Affidavits',
    desc: 'Trained on Nigerian legal handwriting — affidavits, statements, police reports, court filings.'
  },
  {
    icon: <Zap size={22} color="#1D4ED8" />,
    title: 'Accurate in Seconds',
    desc: 'Crossed-out words removed. Caret insertions placed correctly. Legal abbreviations preserved.'
  },
  {
    icon: <Mail size={22} color="#1D4ED8" />,
    title: 'Email to Yourself',
    desc: 'Receive a formatted Word document (.docx) and a secure link to continue editing on your computer.'
  },
  {
    icon: <Monitor size={22} color="#1D4ED8" />,
    title: 'Continue on PC',
    desc: 'Open your session link on any device. Your transcript is stored securely for 7 days.'
  },
  {
    icon: <Shield size={22} color="#1D4ED8" />,
    title: 'Private & Secure',
    desc: 'Files are processed and immediately discarded. Nothing is stored permanently without your action.'
  },
  {
    icon: <Scale size={22} color="#1D4ED8" />,
    title: 'Built for Nigerian Law',
    desc: 'Understands Lagos, Abuja, and state court formats — from magistrate courts to the Supreme Court.'
  },
];

const STEPS = [
  { num: '01', title: 'Upload', desc: 'Take a photo or upload a scanned PDF of your handwritten document.' },
  { num: '02', title: 'Transcribe', desc: 'Inkto reads every word, removes cross-outs, and inserts annotations — in seconds.' },
  { num: '03', title: 'Export', desc: 'Download as .docx, copy the text, print, or email the file to yourself to edit on PC.' },
];

export default function LandingPage({ onGetStarted }) {
  return (
    <div style={{ minHeight: '100vh', background: '#F5F4F0', fontFamily: "'Inter', sans-serif" }}>

      {/* ── Nav ── */}
      <nav style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0 40px', height: '64px',
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #E4E2DC',
        position: 'sticky', top: 0, zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '30px', height: '30px', background: '#1C1917',
            borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Scale size={16} color="#fff" />
          </div>
          <span style={{ fontWeight: 700, fontSize: '17px', letterSpacing: '-0.3px', color: '#1C1917' }}>Inkto</span>
        </div>
        <button onClick={onGetStarted} style={{
          padding: '9px 22px', background: '#1C1917', color: '#fff',
          border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600',
          cursor: 'pointer', letterSpacing: '-0.1px',
          transition: 'background 0.2s, transform 0.15s'
        }}
          onMouseEnter={e => e.currentTarget.style.background = '#2d2926'}
          onMouseLeave={e => e.currentTarget.style.background = '#1C1917'}
        >
          Open App →
        </button>
      </nav>

      {/* ── Hero ── */}
      <section style={{
        maxWidth: '760px', margin: '0 auto',
        padding: '80px 24px 64px', textAlign: 'center'
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          background: '#EFF6FF', border: '1px solid #BFDBFE',
          borderRadius: '99px', padding: '5px 14px',
          fontSize: '12px', fontWeight: '600', color: '#1D4ED8',
          marginBottom: '28px', letterSpacing: '0.02em'
        }}>
          <Scale size={13} /> For Nigerian Legal Professionals
        </div>

        <h1 style={{
          fontSize: 'clamp(34px, 6vw, 58px)', fontWeight: 800, lineHeight: 1.08,
          letterSpacing: '-1.5px', color: '#1C1917', marginBottom: '22px'
        }}>
          Handwritten court documents,<br />
          <span style={{ color: '#1D4ED8' }}>transcribed instantly.</span>
        </h1>

        <p style={{
          fontSize: '18px', color: '#78716C', maxWidth: '500px',
          margin: '0 auto 40px', lineHeight: 1.65, fontWeight: 400
        }}>
          Upload a photo or scanned PDF. Inkto reads your legal handwriting with precision — crossed-out text removed, caret insertions placed — and returns a clean, editable transcript.
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={onGetStarted} style={{
            padding: '15px 36px', background: '#1D4ED8', color: '#fff',
            border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '700',
            cursor: 'pointer', boxShadow: '0 4px 20px rgba(29,78,216,0.35)',
            transition: 'transform 0.15s, box-shadow 0.15s', letterSpacing: '-0.1px'
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(29,78,216,0.45)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(29,78,216,0.35)'; }}
          >
            Try for Free — No Sign-Up
          </button>
          <button onClick={onGetStarted} style={{
            padding: '15px 28px', background: '#fff', color: '#1C1917',
            border: '1.5px solid #E4E2DC', borderRadius: '10px', fontSize: '15px', fontWeight: '600',
            cursor: 'pointer', transition: 'border-color 0.2s'
          }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#1C1917'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#E4E2DC'}
          >
            See How It Works ↓
          </button>
        </div>
      </section>

      {/* ── App Preview ── */}
      <section style={{ maxWidth: '820px', margin: '0 auto 80px', padding: '0 24px' }}>
        <div style={{
          borderRadius: '20px', overflow: 'hidden',
          boxShadow: '0 24px 80px rgba(0,0,0,0.14)',
          border: '1px solid #E4E2DC'
        }}>
          <img src="/hero.jpg" alt="Inkto in action — handwritten document being transcribed" style={{ width: '100%', display: 'block' }} />
        </div>
      </section>

      {/* ── How It Works ── */}
      <section style={{ maxWidth: '760px', margin: '0 auto 80px', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <p style={{ fontSize: '12px', fontWeight: '700', color: '#1D4ED8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>
            Simple Three-Step Process
          </p>
          <h2 style={{ fontSize: '30px', fontWeight: '800', letterSpacing: '-0.7px', color: '#1C1917' }}>
            From photo to Word document in under a minute
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
          {STEPS.map((s, i) => (
            <div key={s.num} style={{ position: 'relative' }}>
              {i < STEPS.length - 1 && (
                <div style={{
                  display: 'none' // arrow connectors hidden on mobile, shown by layout
                }} />
              )}
              <div style={{
                background: '#fff', border: '1px solid #E4E2DC',
                borderRadius: '16px', padding: '28px 24px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
              }}>
                <div style={{
                  fontSize: '13px', fontWeight: '800', color: '#1D4ED8',
                  letterSpacing: '0.05em', marginBottom: '12px'
                }}>{s.num}</div>
                <h3 style={{ fontSize: '17px', fontWeight: '700', marginBottom: '8px', color: '#1C1917' }}>{s.title}</h3>
                <p style={{ fontSize: '14px', color: '#78716C', lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ maxWidth: '760px', margin: '0 auto 80px', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <p style={{ fontSize: '12px', fontWeight: '700', color: '#1D4ED8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>
            Everything You Need
          </p>
          <h2 style={{ fontSize: '30px', fontWeight: '800', letterSpacing: '-0.7px', color: '#1C1917' }}>
            Designed for how lawyers actually work
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          {FEATURES.map(f => (
            <div key={f.title} style={{
              background: '#fff', border: '1px solid #E4E2DC',
              borderRadius: '14px', padding: '24px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              transition: 'box-shadow 0.2s, transform 0.2s'
            }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.09)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <div style={{
                width: '44px', height: '44px', background: '#EFF6FF',
                borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '16px'
              }}>
                {f.icon}
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '8px', color: '#1C1917' }}>{f.title}</h3>
              <p style={{ fontSize: '13px', color: '#78716C', lineHeight: 1.65 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Email + Session Feature Highlight ── */}
      <section style={{ maxWidth: '760px', margin: '0 auto 80px', padding: '0 24px' }}>
        <div style={{
          background: '#1C1917', borderRadius: '20px',
          padding: '48px 40px', color: '#fff',
          display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.18)'
        }}>
          <div style={{
            display: 'flex', gap: '12px', marginBottom: '28px', flexWrap: 'wrap', justifyContent: 'center'
          }}>
            {[
              { icon: <Mail size={18} />, label: 'Email to self' },
              { icon: <ArrowRight size={16} />, label: null },
              { icon: <Monitor size={18} />, label: 'Open on PC' },
              { icon: <ArrowRight size={16} />, label: null },
              { icon: <FileText size={18} />, label: 'Edit & export' },
            ].map((item, i) => item.label ? (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: 'rgba(255,255,255,0.1)', borderRadius: '8px',
                padding: '8px 14px', fontSize: '13px', fontWeight: '600'
              }}>
                {item.icon} {item.label}
              </div>
            ) : (
              <div key={i} style={{ display: 'flex', alignItems: 'center', color: 'rgba(255,255,255,0.3)' }}>
                {item.icon}
              </div>
            ))}
          </div>
          <h2 style={{ fontSize: '26px', fontWeight: '800', marginBottom: '16px', letterSpacing: '-0.5px', lineHeight: 1.2 }}>
            Transcribe on phone,<br />edit on your laptop
          </h2>
          <p style={{ color: '#A8A29E', maxWidth: '440px', lineHeight: 1.65, marginBottom: '32px', fontSize: '15px' }}>
            After transcribing, email the result to yourself. You'll receive the Word document attached, plus a secure link. Click that link on your laptop to pick up exactly where you left off — for 7 days.
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {[
              { icon: <CheckCircle size={14} />, text: 'Formatted .docx attached' },
              { icon: <CheckCircle size={14} />, text: '7-day session link' },
              { icon: <CheckCircle size={14} />, text: 'No account required' },
            ].map(item => (
              <div key={item.text} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                color: '#86EFAC', fontSize: '13px', fontWeight: '600'
              }}>
                {item.icon} {item.text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section style={{ textAlign: 'center', padding: '0 24px 96px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px', marginBottom: '16px', color: '#1C1917' }}>
          Ready to try it?
        </h2>
        <p style={{ color: '#78716C', marginBottom: '32px', fontSize: '15px' }}>
          No sign-up. Works in your browser. Add to your home screen for instant access.
        </p>
        <button onClick={onGetStarted} style={{
          padding: '15px 40px', background: '#1D4ED8', color: '#fff',
          border: 'none', borderRadius: '10px', fontSize: '15px',
          fontWeight: '700', cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(29,78,216,0.35)',
          transition: 'transform 0.15s, box-shadow 0.15s'
        }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(29,78,216,0.45)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(29,78,216,0.35)'; }}
        >
          Launch Inkto →
        </button>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: '1px solid #E4E2DC',
        padding: '24px', textAlign: 'center',
        fontSize: '13px', color: '#A8A29E', background: '#fff'
      }}>
        © {new Date().getFullYear()} Inkto · Built for Nigerian legal professionals
      </footer>
    </div>
  );
}
