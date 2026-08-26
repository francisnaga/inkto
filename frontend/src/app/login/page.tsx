'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    setError('');
    try {
      const res = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to send code.'); return; }
      router.push(`/verify?email=${encodeURIComponent(email)}`);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', padding: '0 0 32px' }}>

      {/* Top brand area */}
      <div style={{ paddingTop: 64, paddingBottom: 48, textAlign: 'center' }}>
        {/* Logo mark */}
        <div style={{ width: 64, height: 64, borderRadius: 20, background: 'linear-gradient(135deg, #1D4ED8 0%, #7C3AED 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 8px 24px rgba(37,99,235,0.35)' }}>
          <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
            <path d="M8 26V10h4v16H8zm7-16h4l5 16h-4l-5-16z" fill="white" fillOpacity="0.9" />
          </svg>
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.7px', color: '#0C0A09', margin: '0 0 8px', fontFamily: 'inherit' }}>
          Welcome to Inkto
        </h1>
        <p style={{ fontSize: 15, color: '#78716C', margin: 0, lineHeight: 1.5, fontFamily: 'inherit' }}>
          Handwriting &amp; scans — typed in seconds.
        </p>
      </div>

      {/* Card */}
      <div style={{ flex: 1, padding: '0 20px' }}>
        <div style={{ background: '#fff', border: '1px solid #E7E5E4', borderRadius: 24, padding: '32px 24px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1C1917', margin: '0 0 6px', letterSpacing: '-0.4px' }}>Sign in</h2>
          <p style={{ fontSize: 13, color: '#78716C', margin: '0 0 28px', lineHeight: 1.5 }}>
            No password needed — we&apos;ll email you a 6-digit code.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label htmlFor="email" style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#44403C', marginBottom: 8, letterSpacing: '0.3px', textTransform: 'uppercase' }}>
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={{
                  width: '100%', height: 52, padding: '0 16px', fontSize: 16,
                  border: `1.5px solid ${error ? '#EF4444' : '#E7E5E4'}`,
                  borderRadius: 14, background: '#FAFAF9', color: '#1C1917',
                  outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                }}
                onFocus={e => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.12)'; e.target.style.background = '#fff'; }}
                onBlur={e => { e.target.style.borderColor = error ? '#EF4444' : '#E7E5E4'; e.target.style.boxShadow = 'none'; e.target.style.background = '#FAFAF9'; }}
              />
            </div>

            {error && (
              <div style={{ padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, fontSize: 13, fontWeight: 600, color: '#DC2626' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending || !email}
              style={{
                width: '100%', height: 54, background: isPending || !email ? '#D6D3D1' : 'linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%)',
                border: 'none', borderRadius: 16, fontSize: 16, fontWeight: 700, color: '#fff',
                cursor: isPending || !email ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                transition: 'all 0.18s', boxShadow: isPending || !email ? 'none' : '0 4px 16px rgba(37,99,235,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {isPending ? (
                <>
                  <div style={{ width: 18, height: 18, border: '2.5px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.75s linear infinite' }} />
                  Sending code…
                </>
              ) : 'Continue →'}
            </button>
          </form>
        </div>

        {/* Fine print */}
        <p style={{ textAlign: 'center', fontSize: 12, color: '#A8A29E', marginTop: 24, lineHeight: 1.6, padding: '0 8px' }}>
          By continuing you agree to our{' '}
          <a href="/terms" style={{ color: '#78716C', fontWeight: 600, textDecoration: 'none' }}>Terms</a>
          {' '}and{' '}
          <a href="/privacy" style={{ color: '#78716C', fontWeight: 600, textDecoration: 'none' }}>Privacy Policy</a>.
        </p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
