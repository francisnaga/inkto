'use client';

import { useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';
import { InktoLogo } from '@/components/inkto-logo';

const C = {
  paper:   '#FBFAF7',
  border:  '#E4E1D9',
  ink:     '#0B0D12',
  inkMid:  '#444240',
  inkMute: '#6B6760',
  blue:    '#24467A',
  blueSub: '#EEF2F8',
  red:     '#B23A34',
  green:   '#1F6B3A',
  greenS:  '#EBF5EE',
  warmMid: '#C8C4BA',
};
const UI = '-apple-system, "Segoe UI", Roboto, sans-serif';

function VerifyForm() {
  const router = useRouter();
  const params = useSearchParams();
  const email  = params.get('email') || '';
  const { refreshUser } = useAuth();

  const [otp, setOtp]         = useState('');
  const [busy, setBusy]       = useState(false);
  const [err, setErr]         = useState('');
  const [done, setDone]       = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [resent, setResent]   = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCooldown = () => {
    setCooldown(60);
    timerRef.current = setInterval(() => {
      setCooldown(n => { if (n <= 1) { if (timerRef.current) clearInterval(timerRef.current); return 0; } return n - 1; });
    }, 1000);
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr('');
    try {
      const res  = await fetch('/api/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ email, otp }) });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || 'Invalid code — try again.'); return; }
      if (data.sessionToken) {
        localStorage.setItem('inkto_session', data.sessionToken);
      }
      setDone(true);
      await refreshUser();
      setTimeout(() => router.replace('/app'), 700);
    } catch {
      setErr('Network error — please try again.');
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    if (cooldown > 0) return;
    startCooldown(); setResent(true);
    try { await fetch('/api/send-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) }); } catch {}
  };

  const ready = otp.length === 6;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', fontFamily: UI }}>

      {/* Back link */}
      <div style={{ paddingTop: 28 }}>
        <Link
          href="/login"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: C.inkMute, textDecoration: 'none' }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke={C.inkMute} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Back
        </Link>
      </div>

      {/* Header */}
      <div style={{ paddingTop: 40, paddingBottom: 40 }}>
        <div style={{ marginBottom: 20 }}>
          <InktoLogo size={28} />
        </div>
        <h1
          style={{
            fontFamily: 'Georgia, "Iowan Old Style", "Times New Roman", serif',
            fontSize: 24,
            fontWeight: 700,
            color: C.ink,
            margin: '0 0 10px',
            letterSpacing: '-0.02em',
          }}
        >
          Check your email
        </h1>
        <p style={{ fontSize: 14, color: C.inkMute, margin: 0, lineHeight: 1.6 }}>
          We sent a 6-digit code to{' '}
          <span style={{ fontFamily: 'ui-monospace, "SF Mono", Consolas, monospace', fontSize: 13, fontWeight: 600, color: C.ink }}>{email}</span>
        </p>
      </div>

      {/* Form */}
      <div style={{ height: 1, background: C.border, marginBottom: 32 }} />

      <form onSubmit={verify} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.inkMid, marginBottom: 10, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            6-digit code
          </label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="000000"
            value={otp}
            onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            autoFocus
            style={{
              width: '100%', height: 60, padding: '0 16px',
              fontSize: 28,
              fontFamily: 'ui-monospace, "SF Mono", Consolas, monospace',
              letterSpacing: '0.4em', textAlign: 'center',
              border: `1px solid ${err ? C.red : ready ? C.blue : C.border}`,
              borderRadius: 8, background: '#FFFFFF', color: C.ink,
              outline: 'none', boxSizing: 'border-box',
              transition: 'border-color 150ms ease',
            }}
            onFocus={e => { e.target.style.boxShadow = `0 0 0 2px ${C.blueSub}`; }}
            onBlur={e => { e.target.style.boxShadow = 'none'; }}
          />
        </div>

        {err && <p style={{ margin: 0, fontSize: 13, color: C.red, lineHeight: 1.5 }}>{err}</p>}

        {done && (
          <p style={{ margin: 0, fontSize: 13, color: C.green, fontWeight: 600, lineHeight: 1.5 }}>
            ✓ Verified — signing you in…
          </p>
        )}

        <button
          type="submit"
          disabled={busy || !ready || done}
          style={{
            width: '100%', height: 48,
            background: busy || !ready ? C.warmMid : C.blue,
            border: 'none', borderRadius: 8,
            fontSize: 14, fontWeight: 700, color: '#fff',
            cursor: busy || !ready ? 'not-allowed' : 'pointer',
            fontFamily: UI,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'background 150ms ease',
          }}
          onMouseEnter={e => { if (!busy && ready) (e.currentTarget as HTMLButtonElement).style.background = '#3A5C94'; }}
          onMouseLeave={e => { if (!busy && ready) (e.currentTarget as HTMLButtonElement).style.background = C.blue; }}
        >
          {busy
            ? <><Spinner /> Verifying…</>
            : 'Verify & sign in'}
        </button>
      </form>

      {/* Resend */}
      <div style={{ height: 1, background: C.border, margin: '32px 0 20px' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <p style={{ fontSize: 13, color: C.inkMute, margin: 0 }}>Didn&apos;t receive it?</p>
        <button
          onClick={resend}
          disabled={cooldown > 0}
          style={{ fontSize: 13, fontWeight: 700, color: cooldown > 0 ? C.warmMid : C.blue, background: 'none', border: 'none', cursor: cooldown > 0 ? 'default' : 'pointer', fontFamily: UI, padding: 0 }}
        >
          {cooldown > 0 ? `Resend in ${cooldown}s` : resent ? '✓ Resent' : 'Resend code'}
        </button>
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

export default function VerifyPage() {
  return (
    <Suspense fallback={<div style={{ height: 200 }} />}>
      <VerifyForm />
    </Suspense>
  );
}
