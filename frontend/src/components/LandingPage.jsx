import React from 'react';
import { Scale, Mail, Monitor, FileText, Camera, Download } from 'lucide-react';

export default function LandingPage({ onGetStarted }) {
  return (
    <div style={{ minHeight: '100vh', background: '#F5F4F0', fontFamily: "'Inter', sans-serif" }}>

      {/* Nav */}
      <nav style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0 32px', height: '60px',
        background: '#F5F4F0',
        borderBottom: '1px solid #E4E2DC',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
          <div style={{
            width: '28px', height: '28px', background: '#1C1917',
            borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Scale size={14} color="#fff" />
          </div>
          <span style={{ fontWeight: 700, fontSize: '17px', letterSpacing: '-0.3px', color: '#1C1917' }}>Inkto</span>
        </div>
        <button onClick={onGetStarted} style={{
          padding: '8px 20px', background: '#1C1917', color: '#fff',
          border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600',
          cursor: 'pointer',
        }}>
          Open App
        </button>
      </nav>

      {/* Hero */}
      <section style={{
        maxWidth: '680px', margin: '0 auto',
        padding: '72px 24px 56px', textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: 'clamp(32px, 6vw, 54px)', fontWeight: 800, lineHeight: 1.1,
          letterSpacing: '-1.5px', color: '#1C1917', marginBottom: '20px'
        }}>
          Your handwriting,<br />
          <span style={{ color: '#1D4ED8' }}>typed for you.</span>
        </h1>

        <p style={{
          fontSize: '18px', color: '#78716C', maxWidth: '460px',
          margin: '0 auto 36px', lineHeight: 1.6, fontWeight: 400
        }}>
          Snap a photo of any handwritten document. Inkto reads it and gives you clean, editable text in seconds. Crossed-out words gone. Insertions in the right place.
        </p>

        <button onClick={onGetStarted} style={{
          padding: '14px 32px', background: '#1D4ED8', color: '#fff',
          border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '700',
          cursor: 'pointer', boxShadow: '0 4px 18px rgba(29,78,216,0.3)',
          transition: 'transform 0.15s',
        }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          Try it free
        </button>
        <p style={{ marginTop: '12px', fontSize: '13px', color: '#A8A29E' }}>
          No sign-up. Works in your browser.
        </p>
      </section>

      {/* Hero image */}
      <section style={{ maxWidth: '820px', margin: '0 auto 80px', padding: '0 24px' }}>
        <div style={{
          borderRadius: '16px', overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
          border: '1px solid #E4E2DC'
        }}>
          <img src="/hero.jpg" alt="Inkto in action" style={{ width: '100%', display: 'block' }} />
        </div>
      </section>

      {/* How it works */}
      <section style={{ maxWidth: '680px', margin: '0 auto 80px', padding: '0 24px' }}>
        <h2 style={{
          fontSize: '26px', fontWeight: '800', letterSpacing: '-0.5px',
          color: '#1C1917', marginBottom: '32px', textAlign: 'center'
        }}>
          Three steps, done.
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[
            { n: '1', icon: <Camera size={18} color="#1D4ED8" />, title: 'Take a photo', desc: 'Use your phone camera or upload a scanned PDF. Up to 30 pages at once.' },
            { n: '2', icon: <FileText size={18} color="#1D4ED8" />, title: 'Get clean text', desc: 'Inkto handles crossed-out words, caret insertions, and messy handwriting automatically.' },
            { n: '3', icon: <Download size={18} color="#1D4ED8" />, title: 'Use it however you want', desc: 'Copy the text, download a Word file, print it, or email it to yourself to edit on your PC.' },
          ].map(s => (
            <div key={s.n} style={{
              display: 'flex', gap: '18px', alignItems: 'flex-start',
              background: '#fff', border: '1px solid #E4E2DC',
              borderRadius: '14px', padding: '22px 24px',
            }}>
              <div style={{
                width: '38px', height: '38px', borderRadius: '10px',
                background: '#EFF6FF', display: 'flex', alignItems: 'center',
                justifyContent: 'center', flexShrink: 0
              }}>
                {s.icon}
              </div>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1C1917', marginBottom: '5px' }}>{s.title}</h3>
                <p style={{ fontSize: '14px', color: '#78716C', lineHeight: 1.6, margin: 0 }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Email to yourself */}
      <section style={{ maxWidth: '680px', margin: '0 auto 80px', padding: '0 24px' }}>
        <div style={{
          background: '#1C1917', borderRadius: '18px',
          padding: '40px 36px', color: '#fff',
        }}>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              background: 'rgba(255,255,255,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <Mail size={19} color="#fff" />
            </div>
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              background: 'rgba(255,255,255,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <Monitor size={19} color="#fff" />
            </div>
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '14px', letterSpacing: '-0.4px', lineHeight: 1.25 }}>
            Transcribe on your phone, finish on your laptop.
          </h2>
          <p style={{ color: '#A8A29E', lineHeight: 1.65, fontSize: '15px', marginBottom: '24px', maxWidth: '440px' }}>
            After transcribing, hit "Share and Email." You'll get the Word document attached to your email, plus a link. Open that link on any device and your transcript is right there, ready to edit.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              'Word document attached to every email',
              'Secure session link, valid for 7 days',
              'No account or login needed',
            ].map(t => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '6px', height: '6px', borderRadius: '50%',
                  background: '#86EFAC', flexShrink: 0
                }} />
                <span style={{ fontSize: '14px', color: '#D6D3CE' }}>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ textAlign: 'center', padding: '0 24px 80px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: '800', letterSpacing: '-0.5px', marginBottom: '14px', color: '#1C1917' }}>
          Give it a try.
        </h2>
        <p style={{ color: '#78716C', marginBottom: '28px', fontSize: '15px' }}>
          It takes about 10 seconds. No sign-up, no credit card.
        </p>
        <button onClick={onGetStarted} style={{
          padding: '14px 36px', background: '#1D4ED8', color: '#fff',
          border: 'none', borderRadius: '10px', fontSize: '15px',
          fontWeight: '700', cursor: 'pointer',
          boxShadow: '0 4px 18px rgba(29,78,216,0.3)',
          transition: 'transform 0.15s',
        }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          Open Inkto
        </button>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid #E4E2DC',
        padding: '22px 24px', textAlign: 'center',
        fontSize: '13px', color: '#A8A29E', background: '#fff'
      }}>
        © {new Date().getFullYear()} Inkto
      </footer>
    </div>
  );
}
