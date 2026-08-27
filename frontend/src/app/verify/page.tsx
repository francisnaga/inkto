'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
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
  const { user, loading, refreshUser } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/app');
    }
  }, [user, loading, router]);

  const [otp, setOtp]         = useState('');
  const [busy, setBusy]       = useState(false);
  const [err, setErr]         = useState('');
  const [done, setDone]       = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [resent, setResent]   = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
      if (!res.ok) {
        setErr(data.error || 'Invalid code — try again.');
        setOtp('');
        setTimeout(() => inputRef.current?.focus(), 50);
        return;
      }
      if (data.sessionToken) {
        localStorage.setItem('inkto_session', data.sessionToken);
      }
      if (data.refreshToken) {
        localStorage.setItem('inkto_refresh_token', data.refreshToken);
      }
      setDone(true);
      await refreshUser();
      setTimeout(() => router.replace('/app'), 500);
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

  const ready = otp.length >= 6 && otp.length <= 8;

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
            fontFamily: UI,
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
          We sent a verification code to{' '}
          <span style={{ fontFamily: 'ui-monospace, "SF Mono", Consolas, monospace', fontSize: 13, fontWeight: 600, color: C.ink }}>{email}</span>
        </p>
      </div>

      {/* Form */}
      <div style={{ height: 1, background: C.border, marginBottom: 32 }} />

      <form onSubmit={verify} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.inkMid, marginBottom: 10, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Verification Code
          </label>
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="one-time-code"
            maxLength={8}
            placeholder="000000"
            value={otp}
            onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 8))}
            autoFocus
            style={{
              width: '100%', height: 60, padding: '0 16px',
              fontSize: 26,
              fontFamily: 'ui-monospace, "SF Mono", Consolas, monospace',
              letterSpacing: '0.3em', textAlign: 'center',
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

        {/* Resend */}
        <div style={{ textAlign: 'center', paddingTop: 8 }}>
          {cooldown > 0 ? (
            <span style={{ fontSize: 13, color: C.inkMute }}>
              Resend code in <strong style={{ color: C.inkMid }}>{cooldown}s</strong>
            </span>
          ) : (
            <button
              type="button"
              onClick={resend}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: C.blue, fontFamily: UI, padding: 0 }}
            >
              {resent ? 'Resend code again' : 'Didn’t receive a code? Resend'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

function Spinner() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
      <circle cx="7.5" cy="7.5" r="6" stroke="rgba(255,255,255,0.35)" strokeWidth="2" />
      <path d="M7.5 1.5A6 6 0 0 1 13.5 7.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh' }} />}>
      <VerifyForm />
    </Suspense>
  );
}
