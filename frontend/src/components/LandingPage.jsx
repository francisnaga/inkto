import React from 'react';

export default function LandingPage({ onGetStarted }) {
  return (
    <div style={{ minHeight: '100vh', background: '#F7F7F5', fontFamily: "'Inter', sans-serif" }}>

      {/* Nav */}
      <nav style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '20px 40px', borderBottom: '1px solid #E2E2DC', background: '#fff'
      }}>
        <span style={{ fontWeight: 700, fontSize: '18px', letterSpacing: '-0.3px' }}>Inkto</span>
        <button onClick={onGetStarted} style={{
          padding: '8px 20px', background: '#1A1A1A', color: '#fff',
          border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer'
        }}>
          Launch App →
        </button>
      </nav>

      {/* Hero */}
      <section style={{ maxWidth: '860px', margin: '0 auto', padding: '72px 24px 48px', textAlign: 'center' }}>
        <h1 style={{
          fontSize: 'clamp(36px, 6vw, 62px)', fontWeight: 800, lineHeight: 1.1,
          letterSpacing: '-1.5px', color: '#1A1A1A', marginBottom: '20px'
        }}>
          Your handwriting,<br />
          <span style={{ color: '#2563EB' }}>typed instantly.</span>
        </h1>
        <p style={{
          fontSize: '18px', color: '#6B6B6B', maxWidth: '520px',
          margin: '0 auto 40px', lineHeight: 1.6
        }}>
          Snap a photo or upload a scanned PDF of any handwritten document.
          Inkto reads it and gives you clean, editable text in seconds.
        </p>
        <button onClick={onGetStarted} style={{
          padding: '16px 36px', background: '#2563EB', color: '#fff',
          border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: '700',
          cursor: 'pointer', boxShadow: '0 4px 20px rgba(37,99,235,0.35)',
          transition: 'transform 0.15s ease'
        }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          Get Started — It's Free
        </button>
      </section>

      {/* Hero Image */}
      <section style={{ maxWidth: '820px', margin: '0 auto 64px', padding: '0 24px' }}>
        <div style={{
          borderRadius: '16px', overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
          border: '1px solid #E2E2DC'
        }}>
          <img src="/hero.jpg" alt="Inkto in action" style={{ width: '100%', display: 'block' }} />
        </div>
      </section>

      {/* Features */}
      <section style={{ maxWidth: '860px', margin: '0 auto 80px', padding: '0 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
          {[
            { icon: '📷', title: 'Snap & Upload', desc: 'Use your phone camera directly. No scanner needed.' },
            { icon: '📄', title: 'Multi-Page', desc: 'Upload multiple images and get one clean transcript.' },
            { icon: '⚡', title: 'Seconds, Not Hours', desc: 'Claude AI reads even messy handwriting with high accuracy.' },
          ].map(f => (
            <div key={f.title} style={{
              background: '#fff', border: '1px solid #E2E2DC',
              borderRadius: '12px', padding: '28px 24px'
            }}>
              <div style={{ fontSize: '28px', marginBottom: '12px' }}>{f.icon}</div>
              <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>{f.title}</h3>
              <p style={{ fontSize: '14px', color: '#6B6B6B', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{
        background: '#1A1A1A', color: '#fff',
        textAlign: 'center', padding: '64px 24px'
      }}>
        <h2 style={{ fontSize: '30px', fontWeight: 800, marginBottom: '16px', letterSpacing: '-0.5px' }}>
          Ready to try it?
        </h2>
        <p style={{ color: '#aaa', marginBottom: '32px', fontSize: '15px' }}>
          Works in your browser. Add it to your home screen for quick access.
        </p>
        <button onClick={onGetStarted} style={{
          padding: '14px 32px', background: '#2563EB', color: '#fff',
          border: 'none', borderRadius: '10px', fontSize: '15px',
          fontWeight: '700', cursor: 'pointer'
        }}>
          Launch Inkto →
        </button>
      </section>

      {/* Footer */}
      <footer style={{
        textAlign: 'center', padding: '24px',
        fontSize: '13px', color: '#aaa', background: '#1A1A1A'
      }}>
        © {new Date().getFullYear()} Inkto
      </footer>
    </div>
  );
}
