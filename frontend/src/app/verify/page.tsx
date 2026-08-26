'use client';

import { useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';
import { Suspense } from 'react';

function VerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const { refreshUser } = useAuth();

  const [otp, setOtp] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendSent, setResendSent] = useState(false);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCooldown = () => {
    setResendCooldown(60);
    cooldownRef.current = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) { if (cooldownRef.current) clearInterval(cooldownRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true); setError('');
    try {
      const res = await fetch('/api/verify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Invalid code. Please try again.'); return; }
      setSuccess(true);
      await refreshUser();
      setTimeout(() => router.replace('/app'), 600);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsPending(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    startCooldown(); setResendSent(true);
    try { await fetch('/api/send-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) }); } catch {}
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(val);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', padding: '0 20px 32px' }}>

      {/* Back link */}
      <div style={{ paddingTop: 24, marginBottom: 8 }}>
        <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600, color: '#78716C', textDecoration: 'none' }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M11 4l-5 5 5 5" stroke="#78716C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Back
        </Link>
      </div>

      {/* Header */}
      <div style={{ paddingTop: 32, paddingBottom: 40 }}>
        <div style={{ width: 56, height: 56, borderRadius: 18, background: 'linear-gradient(135deg, #1D4ED8 0%, #7C3AED 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, boxShadow: '0 6px 20px rgba(37,99,235,0.30)' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="14" rx="3" stroke="white" strokeWidth="2"/><path d="M8 8h8M8 12h5" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.6px', color: '#0C0A09', margin: '0 0 8px' }}>Check your email</h1>
        <p style={{ fontSize: 14, color: '#78716C', margin: 0, lineHeight: 1.6 }}>
          We sent a 6-digit code to{' '}
          <span style={{ fontWeight: 700, color: '#1C1917' }}>{email}</span>
        </p>
      </div>

      {/* Card */}
      <div style={{ background: '#fff', border: '1px solid #E7E5E4', borderRadius: 24, padding: '28px 24px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#44403C', marginBottom: 10, letterSpacing: '0.3px', textTransform: 'uppercase' }}>
              Verification code
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="000000"
              value={otp}
              onChange={handleOtpChange}
              autoFocus
              style={{
                width: '100%', height: 68, padding: '0 20px',
                fontSize: 32, fontFamily: 'ui-monospace,monospace', letterSpacing: '0.5em', textAlign: 'center',
                border: `2px solid ${error ? '#EF4444' : otp.length === 6 ? '#22C55E' : '#E7E5E4'}`,
                borderRadius: 16, background: '#FAFAF9', color: '#1C1917',
                outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.18s, box-shadow 0.18s',
              }}
              onFocus={e => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 4px rgba(37,99,235,0.10)'; e.target.style.background = '#fff'; }}
              onBlur={e => { e.target.style.borderColor = error ? '#EF4444' : otp.length === 6 ? '#22C55E' : '#E7E5E4'; e.target.style.boxShadow = 'none'; e.target.style.background = '#FAFAF9'; }}
            />
          </div>

          {error && (
            <div style={{ padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, fontSize: 13, fontWeight: 600, color: '#DC2626' }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{ padding: '12px 16px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12, fontSize: 13, fontWeight: 600, color: '#16A34A', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>✓</span> Verified! Taking you in…
            </div>
          )}

          <button
            type="submit"
            disabled={isPending || otp.length < 6 || success}
            style={{
              width: '100%', height: 54,
              background: isPending || otp.length < 6 ? '#D6D3D1' : 'linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%)',
              border: 'none', borderRadius: 16, fontSize: 16, fontWeight: 700, color: '#fff',
              cursor: isPending || otp.length < 6 ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              transition: 'all 0.18s', boxShadow: otp.length === 6 && !isPending ? '0 4px 16px rgba(37,99,235,0.35)' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {isPending ? (
              <><div style={{ width: 18, height: 18, border: '2.5px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.75s linear infinite' }} />Verifying…</>
            ) : 'Verify & Sign in'}
          </button>
        </form>

        {/* Resend */}
        <div style={{ textAlign: 'center', marginTop: 20, paddingTop: 20, borderTop: '1px solid #F5F5F4' }}>
          <p style={{ fontSize: 13, color: '#78716C', margin: '0 0 8px' }}>Didn&apos;t receive it?</p>
          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0}
            style={{ fontSize: 14, fontWeight: 700, color: resendCooldown > 0 ? '#A8A29E' : '#2563EB', background: 'none', border: 'none', cursor: resendCooldown > 0 ? 'default' : 'pointer', fontFamily: 'inherit', padding: 0 }}
          >
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : resendSent ? '✓ Resend code' : 'Resend code'}
          </button>
        </div>
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div style={{ width: 24, height: 24, border: '2.5px solid #E7E5E4', borderTopColor: '#2563EB', borderRadius: '50%', animation: 'spin 0.75s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    }>
      <VerifyForm />
    </Suspense>
  );
}
