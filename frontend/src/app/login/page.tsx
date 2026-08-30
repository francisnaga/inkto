'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { apiPost } from '@/lib/api';
import { InktoLogo } from '@/components/inkto-logo';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [email, setEmail]   = useState('');
  const [busy, setBusy]     = useState(false);
  const [err, setErr]       = useState('');
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace('/app');
  }, [user, loading, router]);

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail) return;
    setBusy(true); setErr('');
    try {
      await apiPost('/send-otp', { email });
      router.push(`/verify?email=${encodeURIComponent(email)}`);
    } catch (err: any) {
      setErr(err.message || 'Failed to send code.');
    } finally {
      setBusy(false);
    }
  };

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
      overflow: 'hidden',
    }}>
      {/* Background glow */}
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
        style={{ width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column' }}
      >
        {/* Logo + tagline */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
            <InktoLogo size={52} color="#5A45FF" />
          </div>
          <h1 style={{
            fontFamily: '"Poppins", sans-serif',
            fontSize: 28, fontWeight: 700,
            color: '#FFFFFF', margin: '0 0 8px',
            letterSpacing: '-0.02em',
          }}>
            Welcome to Inkto
          </h1>
          <p style={{ fontSize: 14, color: '#64748B', margin: 0, lineHeight: 1.6 }}>
            Capture. Transcribe. Intelligent.
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
          <h2 style={{
            fontFamily: '"Poppins", sans-serif',
            fontSize: 18, fontWeight: 600,
            color: '#FFFFFF', margin: '0 0 6px',
          }}>
            Sign in
          </h2>
          <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 24px', lineHeight: 1.5 }}>
            No password — we'll email you a one-time code.
          </p>

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ position: 'relative' }}>
              <Mail
                size={16}
                style={{
                  position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                  color: focused ? '#5A45FF' : '#475569',
                  transition: 'color 150ms',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder="name@firm.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                autoFocus
                style={{
                  width: '100%', height: 50, paddingLeft: 42, paddingRight: 16,
                  fontSize: 15,
                  border: `1.5px solid ${err ? '#EF4444' : focused ? '#5A45FF' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.04)',
                  color: '#FFFFFF',
                  outline: 'none',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                  transition: 'border-color 150ms ease, box-shadow 150ms ease',
                  boxShadow: focused ? '0 0 0 3px rgba(90,69,255,0.2)' : 'none',
                }}
              />
            </div>

            {err && (
              <p style={{ margin: 0, fontSize: 13, color: '#EF4444', lineHeight: 1.5 }}>{err}</p>
            )}

            <motion.button
              type="submit"
              disabled={!isValidEmail || busy}
              whileTap={isValidEmail && !busy ? { scale: 0.97 } : undefined}
              style={{
                width: '100%', height: 50,
                background: !isValidEmail || busy ? '#1E1F2E' : '#5A45FF',
                border: 'none',
                borderRadius: 12,
                fontSize: 15, fontWeight: 600,
                color: !isValidEmail || busy ? '#4B5563' : '#FFFFFF',
                cursor: !isValidEmail || busy ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'background 150ms, box-shadow 150ms',
                boxShadow: isValidEmail && !busy ? '0 4px 20px rgba(90,69,255,0.4)' : 'none',
              }}
            >
              {busy
                ? <><Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Sending code…</>
                : <>Continue with Email <ArrowRight size={16} /></>
              }
            </motion.button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: '#475569', marginTop: 24, lineHeight: 1.7 }}>
          By continuing you agree to our{' '}
          <a href="/terms" style={{ color: '#5A45FF', textDecoration: 'none' }}>Terms of Service</a>
          {' '}and{' '}
          <a href="/privacy" style={{ color: '#5A45FF', textDecoration: 'none' }}>Privacy Policy</a>.
        </p>
      </motion.div>
    </div>
  );
}
