'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';
import { Loader2, LogOut, ChevronRight, Crown, MessageSquare, FileText, Lock, Shield } from 'lucide-react';

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
const UI      = '-apple-system, "Segoe UI", Roboto, sans-serif';
const DISPLAY = 'Georgia, "Iowan Old Style", "Times New Roman", serif';

const SETTINGS = [
  { icon: <MessageSquare size={16} color={C.blue} />, label: 'Report an issue', href: 'mailto:support@inkto.jointaccount.org', ext: true },
  { icon: <Lock size={16} color={C.inkMute} />,       label: 'Privacy Policy',   href: '/privacy',    ext: false },
  { icon: <FileText size={16} color={C.inkMute} />,   label: 'Terms of Service', href: '/terms',      ext: false },
  { icon: <Shield size={16} color={C.inkMute} />,     label: 'NDPA 2023 Data Rights', href: '/privacy#rights', ext: false },
];

function AccountPageContent() {
  const { user, loading, logout } = useAuth();
  const [plan, setPlan]           = useState<{ status: string; expiresAt: string | null }>({ status: 'free', expiresAt: null });
  const [upgrading, setUpgrading] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const searchParams = useSearchParams();
  const upgraded = searchParams.get('upgrade') === 'success';

  useEffect(() => {
    if (!user) return;
    fetch('/api/user-status', { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (d.subscription_status) setPlan({ status: d.subscription_status, expiresAt: d.plan_expires_at }); })
      .catch(() => {});
  }, [user]);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80, fontFamily: UI }}><Loader2 size={20} color={C.blue} style={{ animation: 'spin 0.8s linear infinite' }} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>;
  }

  if (!user) {
    return (
      <div style={{ paddingTop: 80, paddingBottom: 32, fontFamily: UI }}>
        <h1 style={{ fontFamily: DISPLAY, fontSize: 26, fontWeight: 700, color: C.ink, margin: '0 0 10px', letterSpacing: '-0.02em' }}>Account</h1>
        <div style={{ height: 1, background: C.border, marginBottom: 24 }} />
        <p style={{ fontSize: 14, color: C.inkMute, margin: '0 0 24px', lineHeight: 1.6 }}>
          Sign in to manage your subscription, history, and settings.
        </p>
        <Link href="/login">
          <button style={{ height: 48, padding: '0 28px', background: C.blue, border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: UI }}>
            Sign in
          </button>
        </Link>
      </div>
    );
  }

  const isPro = plan.status === 'active' && (!plan.expiresAt || new Date(plan.expiresAt) > new Date());
  const displayName = user.email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const upgrade = async () => {
    setUpgrading(true);
    try {
      const res  = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: user.email }) });
      const data = await res.json();
      if (data.authorization_url) window.location.href = data.authorization_url;
      else { alert(data.error || 'Could not start upgrade.'); setUpgrading(false); }
    } catch { alert('Network error.'); setUpgrading(false); }
  };

  return (
    <div style={{ paddingTop: 32, paddingBottom: 48, fontFamily: UI }}>

      {upgraded && (
        <p style={{ fontSize: 13, color: C.blue, fontWeight: 600, marginBottom: 20 }}>
          ✓ Payment confirmed — welcome to Pro.
        </p>
      )}

      {/* Identity */}
      <h1 style={{ fontFamily: DISPLAY, fontSize: 26, fontWeight: 700, color: C.ink, margin: '0 0 4px', letterSpacing: '-0.02em' }}>
        {displayName}
      </h1>
      <p style={{ fontSize: 13, color: C.inkMute, margin: '0 0 2px', fontFamily: 'ui-monospace, "SF Mono", Consolas, monospace' }}>
        {user.email}
      </p>
      {isPro && (
        <p style={{ fontSize: 11, fontWeight: 700, color: C.brass, margin: '6px 0 0', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Pro Plan
        </p>
      )}

      {/* Letterhead rule */}
      <div style={{ height: 1, background: C.border, margin: '24px 0' }} />

      {/* Plan section */}
      <div style={{ marginBottom: 8 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: C.warmMid, margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {isPro ? 'Your plan' : 'Current plan'}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Unlimited document scanning',                      ok: true },
            { label: isPro ? 'Unlimited text conversions' : '5 conversions/day', ok: true },
            { label: isPro ? 'Unlimited history'          : '7-day history',     ok: true },
            { label: 'Voice-to-text dictation',                          ok: isPro },
            { label: 'Priority AI processing',                           ok: isPro },
          ].map(({ label, ok }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 13, color: ok ? C.blue : C.border, flexShrink: 0, fontWeight: 700 }}>{ok ? '✓' : '–'}</span>
              <span style={{ fontSize: 13, color: ok ? C.inkMid : C.warmMid }}>{label}</span>
            </div>
          ))}
        </div>

        {!isPro && (
          <button
            onClick={upgrade}
            disabled={upgrading}
            style={{
              width: '100%', height: 48,
              /* Seal Brass as the premium upgrade CTA — the one secondary accent */
              background: C.brassS,
              border: `1px solid ${C.brass}`,
              borderRadius: 6, fontSize: 14, fontWeight: 700, color: C.brass,
              cursor: upgrading ? 'not-allowed' : 'pointer', fontFamily: UI,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'background 150ms ease, color 150ms ease',
            }}
            onMouseEnter={e => { if (!upgrading) { (e.currentTarget as HTMLButtonElement).style.background = C.brass; (e.currentTarget as HTMLButtonElement).style.color = '#fff'; } }}
            onMouseLeave={e => { if (!upgrading) { (e.currentTarget as HTMLButtonElement).style.background = C.brassS; (e.currentTarget as HTMLButtonElement).style.color = C.brass; } }}
          >
            {upgrading && <Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} />}
            <Crown size={14} />
            Upgrade to Pro — ₦5,000/mo
          </button>
        )}

        {isPro && plan.expiresAt && (
          <p style={{ fontSize: 12, color: C.warmMid, marginTop: 12 }}>
            Renews {new Date(plan.expiresAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        )}
      </div>

      {/* Letterhead rule */}
      <div style={{ height: 1, background: C.border, margin: '24px 0' }} />

      {/* Settings list */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: C.warmMid, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Settings
        </p>
        {SETTINGS.map(({ icon, label, href, ext }, i) => (
          <div key={label}>
            {i > 0 && <div style={{ height: 1, background: C.border }} />}
            <a
              href={href}
              {...(ext ? { target: '_blank', rel: 'noreferrer' } : {})}
              style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', textDecoration: 'none' }}
            >
              {icon}
              <span style={{ flex: 1, fontSize: 14, color: C.inkMid, fontWeight: 500 }}>{label}</span>
              <ChevronRight size={15} color={C.warmMid} />
            </a>
          </div>
        ))}
        <div style={{ height: 1, background: C.border }} />
      </div>

      {/* Legal note */}
      <p style={{ fontSize: 11, color: C.warmMid, lineHeight: 1.7, margin: '24px 0' }}>
        Inkto is a productivity tool, not a law firm and does not provide legal advice.
        All AI-generated transcripts must be independently verified before legal use.
      </p>

      {/* Sign out */}
      <button
        onClick={async () => { setLoggingOut(true); await logout(); }}
        disabled={loggingOut}
        style={{
          height: 48, padding: '0 24px',
          background: 'none',
          border: `1px solid ${C.border}`,
          borderRadius: 6, fontSize: 14, fontWeight: 600, color: C.red,
          cursor: loggingOut ? 'not-allowed' : 'pointer', fontFamily: UI,
          display: 'flex', alignItems: 'center', gap: 8,
          transition: 'border-color 150ms ease',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = C.red; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = C.border; }}
      >
        {loggingOut
          ? <Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} />
          : <LogOut size={15} />}
        {loggingOut ? 'Signing out…' : 'Sign out'}
      </button>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={<div style={{ height: 200 }} />}>
      <AccountPageContent />
    </Suspense>
  );
}
