'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';
import { InktoLogo } from '@/components/inkto-logo';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';

function VerifyForm() {
  const router = useRouter();
  const params = useSearchParams();
  const email  = params.get('email') || '';
  const { user, loading, refreshUser } = useAuth();

  useEffect(() => {
    if (!loading && user) router.replace('/app');
  }, [user, loading, router]);

  const [otp, setOtp]           = useState('');
  const [busy, setBusy]         = useState(false);
  const [err, setErr]           = useState('');
  const [done, setDone]         = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [resent, setResent]     = useState(false);
  const [focused, setFocused]   = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const startCooldown = () => {
    setCooldown(60);
    timerRef.current = setInterval(() => {
      setCooldown(n => {
        if (n <= 1) { if (timerRef.current) clearInterval(timerRef.current); return 0; }
        return n - 1;
      });
    }, 1000);
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr('');
    try {
      const res  = await fetch('https://inkto.jointaccount.org/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || 'Invalid code — try again.');
        setOtp('');
        setTimeout(() => inputRef.current?.focus(), 50);
        return;
      }
      if (data.sessionToken) localStorage.setItem('inkto_session', data.sessionToken);
      if (data.refreshToken)  localStorage.setItem('inkto_refresh_token', data.refreshToken);
      localStorage.setItem('inkto_user_email', data.email || email);
      setDone(true);
      await refreshUser();
      setTimeout(() => router.replace('/app'), 600);
    } catch {
      setErr('Network error — please try again.');
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    if (cooldown > 0) return;
    startCooldown(); setResent(true);
    try {
      await fetch('https://inkto.jointaccount.org/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
    } catch {}
  };

  const ready = otp.length >= 6 && otp.length <= 8;

  return (
    <div style={{
      minHeight: '100svh',
      background: '#0D0E14',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 20px',
      fontFamily: '"Inter", -apple-system, sans-serif',
      position: 'relative',
    }}>
      {/* Glow */}
      <div style={{
        position: 'fixed', top: -160, left: '50%', transform: 'translateX(-50%)',
        width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(90,69,255,0.16) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{ width: '100%', maxWidth: 400 }}
      >
        {/* Back */}
        <Link href="/login" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontSize: 13, fontWeight: 600, color: '#64748B', textDecoration: 'none',
          marginBottom: 32,
        }}>
          <ArrowLeft size={16} /> Back to sign in
        </Link>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <InktoLogo size={44} color="#5A45FF" />
          </div>
          <h1 style={{
            fontFamily: '"Poppins", sans-serif',
            fontSize: 24, fontWeight: 700, color: '#FFFFFF',
            margin: '0 0 8px', letterSpacing: '-0.02em',
          }}>
            Check your email
          </h1>
          <p style={{ fontSize: 13, color: '#64748B', margin: 0, lineHeight: 1.6 }}>
            We sent a code to{' '}
            <span style={{ color: '#94A3B8', fontWeight: 600 }}>{email}</span>
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: '#161722',
          borderRadius: 20,
          border: '1px solid rgba(255,255,255,0.07)',
          padding: '32px 28px',
          boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
        }}>
          <form onSubmit={verify} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{
                display: 'block', fontSize: 11, fontWeight: 700, color: '#475569',
                marginBottom: 10, letterSpacing: '0.08em', textTransform: 'uppercase',
              }}>
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
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                autoFocus
                style={{
                  width: '100%', height: 64, padding: '0 16px',
                  fontSize: 32,
                  fontFamily: '"SF Mono", Consolas, monospace',
                  letterSpacing: '0.4em', textAlign: 'center',
                  border: `1.5px solid ${err ? '#EF4444' : done ? '#22C55E' : focused ? '#5A45FF' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.04)',
                  color: '#FFFFFF',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 150ms, box-shadow 150ms',
                  boxShadow: done
                    ? '0 0 0 3px rgba(34,197,94,0.2)'
                    : focused
                      ? '0 0 0 3px rgba(90,69,255,0.2)'
                      : 'none',
                }}
              />
            </div>

            {err && <p style={{ margin: 0, fontSize: 13, color: '#EF4444', lineHeight: 1.5 }}>{err}</p>}
            {done && (
              <p style={{ margin: 0, fontSize: 13, color: '#22C55E', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle size={14} /> Verified — signing you in…
              </p>
            )}

            <motion.button
              type="submit"
              disabled={busy || !ready || done}
              whileTap={!busy && ready && !done ? { scale: 0.97 } : undefined}
              style={{
                width: '100%', height: 50,
                background: busy || !ready ? '#1E1F2E' : '#5A45FF',
                border: 'none', borderRadius: 12,
                fontSize: 15, fontWeight: 600,
                color: busy || !ready ? '#4B5563' : '#FFFFFF',
                cursor: busy || !ready ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'background 150ms, box-shadow 150ms',
                boxShadow: !busy && ready && !done ? '0 4px 20px rgba(90,69,255,0.4)' : 'none',
              }}
            >
              {busy
                ? <><Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Verifying…</>
                : 'Verify & Sign In'
              }
            </motion.button>

            <div style={{ textAlign: 'center' }}>
              {cooldown > 0 ? (
                <span style={{ fontSize: 13, color: '#475569' }}>
                  Resend in <strong style={{ color: '#94A3B8' }}>{cooldown}s</strong>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={resend}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 13, fontWeight: 600, color: '#5A45FF', padding: 0,
                    fontFamily: 'inherit',
                  }}
                >
                  {resent ? 'Resend code again' : "Didn't receive a code? Resend"}
                </button>
              )}
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100svh', background: '#0D0E14' }} />}>
      <VerifyForm />
    </Suspense>
  );
}
