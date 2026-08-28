'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { InktoLogo } from '@/components/inkto-logo';
import { motion } from 'framer-motion';

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
const UI = '-apple-system, "Segoe UI", Roboto, sans-serif';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [busy, setBusy]   = useState(false);
  const [err, setErr]     = useState('');

  useEffect(() => {
    if (!loading && user) {
      router.replace('/app');
    }
  }, [user, loading, router]);

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail) return;
    setBusy(true); setErr('');
    try {
      const res  = await fetch('https://inkto.jointaccount.org/api/send-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || 'Failed to send code.'); return; }
      router.push(`/verify?email=${encodeURIComponent(email)}`);
    } catch (err: any) {
      setErr('Network error: ' + (err.message || String(err)));
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', fontFamily: UI }}
    >

      {/* Top mark */}
      <div style={{ paddingTop: 72, paddingBottom: 56, textAlign: 'center' }}>
        <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'center' }}>
          <InktoLogo size={42} />
        </div>

        {/* Thin letterhead rule */}
        <div style={{ width: 40, height: 1, background: C.border, margin: '0 auto 20px' }} />

        <h1
          style={{
            fontFamily: UI,
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
          No password — we email you a verification code.
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
              style={{
                display: 'block',
                fontSize: 11,
                fontWeight: 700,
                color: C.inkMid,
                marginBottom: 8,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="name@firm.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoFocus
              style={{
                width: '100%',
                height: 48,
                padding: '0 16px',
                fontSize: 15,
                border: `1px solid ${err ? C.red : C.border}`,
                borderRadius: 8,
                background: '#FFFFFF',
                color: C.ink,
                outline: 'none',
                fontFamily: UI,
                boxSizing: 'border-box',
                transition: 'border-color 150ms ease',
              }}
              onFocus={e => { e.target.style.borderColor = C.blue; e.target.style.boxShadow = `0 0 0 2px ${C.blueSub}`; }}
              onBlur={e => { e.target.style.borderColor = err ? C.red : C.border; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          {err && (
            <p style={{ margin: 0, fontSize: 13, color: C.red, lineHeight: 1.5 }}>
              {err}
            </p>
          )}

          <motion.button
            type="submit"
            disabled={!isValidEmail || busy}
            whileTap={isValidEmail && !busy ? { scale: 0.97 } : undefined}
            whileHover={isValidEmail && !busy ? { background: '#3A5C94' } : undefined}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            style={{
              width: '100%',
              height: 48,
              background: !isValidEmail || busy ? C.warmMid : C.blue,
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 700,
              color: '#fff',
              cursor: !isValidEmail || busy ? 'not-allowed' : 'pointer',
              fontFamily: UI,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {busy ? (
              <>
                <Spinner />
                Sending code…
              </>
            ) : (
              'Continue with Email'
            )}
          </motion.button>
        </form>
      </div>
    </motion.div>
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
