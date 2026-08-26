'use client';

import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';
import { User, LogOut, ChevronRight, Loader2, Shield, Crown, MessageSquare, FileText, Lock } from 'lucide-react';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function AccountPageContent() {
  const { user, loading, logout } = useAuth();
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [planStatus, setPlanStatus] = useState<{ status: string; expiresAt: string | null }>({ status: 'free', expiresAt: null });
  const searchParams = useSearchParams();
  const upgradeSuccess = searchParams.get('upgrade') === 'success';

  useEffect(() => {
    if (user) {
      fetch('/api/user-status', { credentials: 'include' })
        .then(r => r.json())
        .then(data => { if (data.subscription_status) setPlanStatus({ status: data.subscription_status, expiresAt: data.plan_expires_at }); })
        .catch(() => {});
    }
  }, [user]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
        <div style={{ width: 28, height: 28, border: '3px solid #E7E5E4', borderTopColor: '#2563EB', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 80, paddingBottom: 40, textAlign: 'center', padding: '80px 32px 40px' }}>
        <div style={{ width: 72, height: 72, borderRadius: 24, background: '#F5F5F4', border: '1.5px solid #E7E5E4', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <User size={32} color="#A8A29E" />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1C1917', margin: '0 0 8px', letterSpacing: '-0.5px' }}>Account</h2>
        <p style={{ fontSize: 14, color: '#78716C', margin: '0 0 32px', lineHeight: 1.6, maxWidth: 260 }}>
          Sign in to manage your subscription, access history, and more.
        </p>
        <Link href="/login">
          <button style={{ padding: '14px 40px', background: 'linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%)', border: 'none', borderRadius: 16, fontSize: 16, fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(37,99,235,0.30)' }}>
            Sign in
          </button>
        </Link>
      </div>
    );
  }

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      const res = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: user.email }) });
      const data = await res.json();
      if (data.authorization_url) { window.location.href = data.authorization_url; }
      else { alert(data.error || 'Failed to start upgrade'); setIsUpgrading(false); }
    } catch { alert('Network error. Please try again.'); setIsUpgrading(false); }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
  };

  const isPro = planStatus.status === 'active' && (!planStatus.expiresAt || new Date(planStatus.expiresAt) > new Date());

  const initials = user.email.charAt(0).toUpperCase();
  const displayName = user.email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <div style={{ paddingTop: 24, paddingBottom: 32, animation: 'fadeUp 0.35s ease' }}>

      {/* Upgrade success */}
      {upgradeSuccess && (
        <div style={{ padding: '14px 16px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 14, fontSize: 13, fontWeight: 600, color: '#16A34A', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>🎉</span> Payment confirmed! Your account is now Pro.
        </div>
      )}

      {/* Profile card */}
      <div style={{ background: '#fff', border: '1.5px solid #E7E5E4', borderRadius: 22, padding: '20px 20px', marginBottom: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: isPro ? 'linear-gradient(135deg, #7C3AED, #2563EB)' : 'linear-gradient(135deg, #1D4ED8, #3B82F6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(37,99,235,0.25)' }}>
            <span style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>{initials}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 16, fontWeight: 800, color: '#1C1917', margin: 0, letterSpacing: '-0.3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayName}</p>
            <p style={{ fontSize: 12, color: '#78716C', margin: '3px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</p>
          </div>
          {isPro && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'linear-gradient(135deg, #7C3AED, #2563EB)', borderRadius: 20, padding: '5px 12px', flexShrink: 0 }}>
              <Crown size={12} color="#fff" />
              <span style={{ fontSize: 11, fontWeight: 800, color: '#fff', letterSpacing: '0.3px' }}>PRO</span>
            </div>
          )}
        </div>
      </div>

      {/* Plan card */}
      <div style={{ background: isPro ? 'linear-gradient(135deg, #1E1B4B, #312E81)' : '#fff', border: isPro ? 'none' : '1.5px solid #E7E5E4', borderRadius: 22, padding: '20px 20px', marginBottom: 16, boxShadow: isPro ? '0 8px 28px rgba(124,58,237,0.25)' : '0 2px 12px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: isPro ? 'rgba(255,255,255,0.65)' : '#A8A29E', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {isPro ? 'Your Plan' : 'Current Plan'}
            </p>
            <h3 style={{ fontSize: 20, fontWeight: 900, color: isPro ? '#fff' : '#1C1917', margin: 0, letterSpacing: '-0.4px' }}>
              {isPro ? 'Pro Plan' : 'Free Plan'}
            </h3>
          </div>
          {isPro && (
            <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Crown size={22} color="#FCD34D" />
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: isPro ? 0 : 16 }}>
          {[
            { label: 'Unlimited document scanning', ok: true },
            { label: isPro ? 'Unlimited text conversions' : '5 text conversions / day', ok: true },
            { label: isPro ? 'Unlimited history' : '7-day history', ok: true },
            { label: 'Voice-to-text dictation', ok: isPro },
            { label: 'Priority AI processing', ok: isPro },
          ].map(({ label, ok }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 13, color: ok ? (isPro ? '#34D399' : '#22C55E') : '#D1D5DB', flexShrink: 0 }}>{ok ? '✓' : '✗'}</span>
              <span style={{ fontSize: 13, color: ok ? (isPro ? 'rgba(255,255,255,0.88)' : '#44403C') : (isPro ? 'rgba(255,255,255,0.35)' : '#A8A29E'), fontWeight: ok ? 500 : 400 }}>
                {label}
              </span>
            </div>
          ))}
        </div>

        {!isPro && (
          <button
            onClick={handleUpgrade}
            disabled={isUpgrading}
            style={{ width: '100%', height: 50, background: 'linear-gradient(135deg, #7C3AED 0%, #2563EB 100%)', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 700, color: '#fff', cursor: isUpgrading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 16px rgba(124,58,237,0.30)', transition: 'opacity 0.15s', opacity: isUpgrading ? 0.7 : 1 }}
          >
            {isUpgrading && <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} />}
            <Crown size={16} />
            Upgrade to Pro — ₦5,000/mo
          </button>
        )}

        {isPro && planStatus.expiresAt && (
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: '12px 0 0', textAlign: 'center' }}>
            Renews {new Date(planStatus.expiresAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        )}
      </div>

      {/* Settings list */}
      <div style={{ background: '#fff', border: '1.5px solid #E7E5E4', borderRadius: 22, overflow: 'hidden', marginBottom: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
        {[
          { icon: <MessageSquare size={17} color="#2563EB" />, bg: '#DBEAFE', label: 'Report an issue', href: 'mailto:support@inkto.jointaccount.org', external: true },
          { icon: <Lock size={17} color="#7C3AED" />, bg: '#EDE9FE', label: 'Privacy Policy', href: '/privacy', external: false },
          { icon: <FileText size={17} color="#D97706" />, bg: '#FEF3C7', label: 'Terms of Service', href: '/terms', external: false },
          { icon: <Shield size={17} color="#16A34A" />, bg: '#DCFCE7', label: 'NDPA 2023 Data Rights', href: '/privacy#rights', external: false },
        ].map(({ icon, bg, label, href, external }) => (
          <a key={label} href={href} {...(external ? { target: '_blank', rel: 'noreferrer' } : {})} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '15px 20px', textDecoration: 'none', borderBottom: '1px solid #F5F5F4', transition: 'background 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#FAFAF9')}
            onMouseLeave={e => (e.currentTarget.style.background = '')}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {icon}
            </div>
            <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: '#1C1917' }}>{label}</span>
            <ChevronRight size={16} color="#D6D3D1" />
          </a>
        ))}
      </div>

      {/* Legal disclaimer */}
      <p style={{ fontSize: 11, color: '#A8A29E', textAlign: 'center', lineHeight: 1.7, padding: '0 8px', marginBottom: 20 }}>
        Inkto is a document productivity tool, not a law firm and does not provide legal advice.
        All AI-generated text and transcripts must be independently verified before legal use.
      </p>

      {/* Sign out */}
      <button
        onClick={handleLogout}
        disabled={isLoggingOut}
        style={{ width: '100%', height: 52, background: '#FEF2F2', border: '1.5px solid #FECACA', borderRadius: 16, fontSize: 15, fontWeight: 700, color: '#DC2626', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.15s' }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#FEE2E2'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#FEF2F2'; }}
      >
        {isLoggingOut ? <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> : <LogOut size={16} />}
        {isLoggingOut ? 'Signing out…' : 'Sign out'}
      </button>

      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div style={{ width: 28, height: 28, border: '3px solid #E7E5E4', borderTopColor: '#2563EB', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    }>
      <AccountPageContent />
    </Suspense>
  );
}
