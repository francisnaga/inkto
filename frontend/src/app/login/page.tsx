'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { InktoWordmark } from '@/components/inkto-logo';

/* Inkto design tokens */
const C = {
  paper:   '#FBFAF7',
  border:  '#E4E1D9',
  ink:     '#0B0D12',
  inkMid:  '#444240',
  inkMute: '#6B6760',
  blue:    '#24467A',
  blueSub: '#EEF2F8',
  brass:   '#A6822C',
  brassS:  '#F8F2E6',
  red:     '#B23A34',
  warmMid: '#C8C4BA',
};
const UI  = '-apple-system, "Segoe UI", Roboto, sans-serif';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [busy, setBusy]   = useState(false);
  const [err, setErr]     = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr('');
    try {
      const res  = await fetch('/api/send-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || 'Failed to send code.'); return; }
      router.push(`/verify?email=${encodeURIComponent(email)}`);
    } catch {
      setErr('Network error — please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', fontFamily: UI }}>

      {/* Top mark — nib animates on first load (this is the one signature moment) */}
      <div style={{ paddingTop: 72, paddingBottom: 56, textAlign: 'center' }}>
        <div style={{ marginBottom: 24 }}>
          <InktoWordmark size={36} animate />
        </div>

        {/* Thin letterhead rule */}
        <div style={{ width: 40, height: 1, background: C.border, margin: '0 auto 20px' }} />

        <h1
          style={{
            fontFamily: 'Georgia, "Iowan Old Style", "Times New Roman", serif',
            fontSize: 26,
            fontWeight: 700,
            color: C.ink,
            margin: '0 0 8px',
            letterSpacing: '-0.02em',
          }}
        >
          Sign in to Inkto
        </h1>
        <p style={{ fontSize: 14, color: C.inkMute, margin: 0, lineHeight: 1.6 }}>
          No password — we email you a 6-digit code.
        </p>
      </div>

      {/* Form section */}
      <div style={{ padding: '0 4px 40px' }}>
        {/* Section rule */}
        <div style={{ height: 1, background: C.border, marginBottom: 32 }} />

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label
              htmlFor="email"
              style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.inkMid, marginBottom: 8, letterSpacing: '0.08em', textTransform: 'uppercase' }}
            >
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
                width: '100%', height: 48, padding: '0 14px',
                fontSize: 15, fontFamily: UI,
                border: `1px solid ${err ? C.red : C.border}`,
                borderRadius: 8, background: '#FFFFFF', color: C.ink,
                outline: 'none', boxSizing: 'border-box',
              }}
              onFocus={e => { e.target.style.borderColor = C.blue; e.target.style.boxShadow = `0 0 0 2px ${C.blueSub}`; }}
              onBlur={e => { e.target.style.borderColor = err ? C.red : C.border; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          {err && (
            <p style={{ margin: 0, fontSize: 13, color: C.red, lineHeight: 1.5 }}>{err}</p>
          )}

          <button
            type="submit"
            disabled={busy || !email}
            style={{
              width: '100%', height: 48,
              background: busy || !email ? C.warmMid : C.blue,
              border: 'none', borderRadius: 8,
              fontSize: 14, fontWeight: 700, color: '#fff',
              cursor: busy || !email ? 'not-allowed' : 'pointer',
              fontFamily: UI, letterSpacing: '0.01em',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'background 150ms ease',
            }}
            onMouseEnter={e => { if (!busy && email) (e.currentTarget as HTMLButtonElement).style.background = '#3A5C94'; }}
            onMouseLeave={e => { if (!busy && email) (e.currentTarget as HTMLButtonElement).style.background = C.blue; }}
          >
            {busy
              ? <><Spinner /> Sending code…</>
              : 'Continue'}
          </button>
        </form>

        {/* Bottom rule + fine print */}
        <div style={{ height: 1, background: C.border, margin: '32px 0 20px' }} />

        <p style={{ fontSize: 11, color: C.warmMid, margin: 0, lineHeight: 1.7, textAlign: 'center' }}>
          By continuing you agree to our{' '}
          <a href="/terms" style={{ color: C.inkMute, textDecoration: 'underline', textUnderlineOffset: 2 }}>Terms</a>
          {' '}and{' '}
          <a href="/privacy" style={{ color: C.inkMute, textDecoration: 'underline', textUnderlineOffset: 2 }}>Privacy Policy</a>.
        </p>
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function Spinner() {
  return (
    <span style={{ width: 15, height: 15, border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
  );
}
