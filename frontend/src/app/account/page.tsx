'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';
import { Loader2, LogOut, ChevronRight, Crown, MessageSquare, FileText, Lock, Shield, Phone, Check } from 'lucide-react';

import { motion } from 'framer-motion';

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
  const router = useRouter();
  const [plan, setPlan]           = useState<{ status: string; expiresAt: string | null; isPro: boolean }>({ status: 'free', expiresAt: null, isPro: false });
  const [phone, setPhone]         = useState('');
  const [savingPhone, setSavingPhone] = useState(false);
  const [phoneSaved, setPhoneSaved]   = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const searchParams = useSearchParams();
  const upgraded = searchParams.get('upgrade') === 'success';

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    fetch(`https://inkto.jointaccount.org/api/user-status?t=${Date.now()}`, { credentials: 'include', headers: { 'Cache-Control': 'no-cache' } })
      .then(r => r.json())
      .then(d => {
        if (d.subscription_status) {
          setPlan({
            status: d.subscription_status,
            expiresAt: d.plan_expires_at,
            isPro: d.is_pro === true || d.subscription_status === 'active'
          });
        }
        if (d.phone) {
          setPhone(d.phone);
        }
      })
      .catch(() => {});
  }, [user]);

  const handleSavePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPhone(true);
    try {
      const res = await fetch('https://inkto.jointaccount.org/api/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      if (res.ok) {
        setPhoneSaved(true);
        setTimeout(() => setPhoneSaved(false), 3000);
      } else {
        alert('Could not update phone number.');
      }
    } catch {
      alert('Network error — please try again.');
    } finally {
      setSavingPhone(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80, fontFamily: UI }}>
        <Loader2 size={20} color={C.blue} style={{ animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const isPro = plan.isPro || plan.status === 'active';
  const displayName = user.email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const upgrade = async () => {
    setUpgrading(true);
    try {
      const res  = await fetch('https://inkto.jointaccount.org/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: user.email }) });
      const data = await res.json();
      if (data.authorization_url) window.location.href = data.authorization_url;
      else { alert(data.error || 'Could not start upgrade.'); setUpgrading(false); }
    } catch { alert('Network error.'); setUpgrading(false); }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      style={{ paddingTop: 32, paddingBottom: 48, fontFamily: UI }}
    >

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

      {/* Profile: Optional Phone Number */}
      <div style={{ marginTop: 20, padding: '16px', background: '#FFFFFF', border: `1px solid ${C.border}`, borderRadius: 8 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: C.warmMid, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Contact Phone (Optional)
        </p>
        <form onSubmit={handleSavePhone} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Phone size={14} color={C.inkMute} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="e.g. 08012345678"
              style={{
                width: '100%',
                height: 40,
                paddingLeft: 34,
                paddingRight: 12,
                background: C.paper,
                border: `1px solid ${C.border}`,
                borderRadius: 6,
                fontSize: 13,
                color: C.ink,
                outline: 'none',
                fontFamily: UI,
                boxSizing: 'border-box'
              }}
            />
          </div>
          <motion.button
            type="submit"
            disabled={savingPhone}
            whileTap={!savingPhone ? { scale: 0.96 } : undefined}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            style={{
              height: 40,
              padding: '0 16px',
              background: phoneSaved ? '#2E7D32' : C.blue,
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              cursor: savingPhone ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {savingPhone ? (
              <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} />
            ) : phoneSaved ? (
              <>
                <Check size={14} /> Saved
              </>
            ) : (
              'Save'
            )}
          </motion.button>
        </form>
        <p style={{ fontSize: 11, color: C.inkMute, margin: '8px 0 0', lineHeight: 1.4 }}>
          Used for service updates and direct assistance. Protected under our privacy policy.
        </p>
      </div>

      {/* Letterhead rule */}
      <div style={{ height: 1, background: C.border, margin: '24px 0' }} />

      {/* Plan section */}
      <div style={{ marginBottom: 8 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: C.warmMid, margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {isPro ? 'Your plan' : 'Current plan'}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Unlimited document scanning',                              ok: true },
            { label: isPro ? 'Unlimited text conversions' : '5 conversions/day', ok: true },
            { label: isPro ? 'Unlimited history'          : '7-day history',     ok: true },
            { label: 'Voice-to-text dictation',                                  ok: isPro },
            { label: 'Priority AI processing',                                   ok: isPro },
          ].map(({ label, ok }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 13, color: ok ? C.blue : C.border, flexShrink: 0, fontWeight: 700 }}>{ok ? '✓' : '–'}</span>
              <span style={{ fontSize: 13, color: ok ? C.inkMid : C.warmMid }}>{label}</span>
            </div>
          ))}
        </div>

        {!isPro && (
          <motion.button
            onClick={upgrade}
            disabled={upgrading}
            whileTap={!upgrading ? { scale: 0.96 } : undefined}
            whileHover={!upgrading ? { background: C.brass, color: '#fff' } : undefined}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            style={{
              width: '100%', height: 48,
              background: C.brassS,
              border: `1px solid ${C.brass}`,
              borderRadius: 6, fontSize: 14, fontWeight: 700, color: C.brass,
              cursor: upgrading ? 'not-allowed' : 'pointer', fontFamily: UI,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {upgrading && <Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} />}
            <Crown size={14} />
            Upgrade to Pro — ₦5,000/mo
          </motion.button>
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
            {ext ? (
              <motion.a
                href={href}
                target="_blank"
                rel="noreferrer"
                whileTap={{ opacity: 0.6 }}
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', textDecoration: 'none' }}
              >
                {icon}
                <span style={{ flex: 1, fontSize: 14, color: C.inkMid, fontWeight: 500 }}>{label}</span>
                <ChevronRight size={15} color={C.warmMid} />
              </motion.a>
            ) : (
              <Link
                href={href}
                style={{ textDecoration: 'none' }}
              >
                <motion.div
                  whileTap={{ opacity: 0.6 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0' }}
                >
                  {icon}
                  <span style={{ flex: 1, fontSize: 14, color: C.inkMid, fontWeight: 500 }}>{label}</span>
                  <ChevronRight size={15} color={C.warmMid} />
                </motion.div>
              </Link>
            )}
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
      <motion.button
        onClick={async () => { setLoggingOut(true); await logout(); }}
        disabled={loggingOut}
        whileTap={!loggingOut ? { scale: 0.96 } : undefined}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        style={{
          height: 48, padding: '0 24px',
          background: 'none',
          border: `1px solid ${C.border}`,
          borderRadius: 6, fontSize: 14, fontWeight: 600, color: C.red,
          cursor: loggingOut ? 'not-allowed' : 'pointer', fontFamily: UI,
          display: 'flex', alignItems: 'center', gap: 8,
        }}
      >
        {loggingOut
          ? <Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} />
          : <LogOut size={15} />}
        {loggingOut ? 'Signing out…' : 'Sign out'}
      </motion.button>
      
    </motion.div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={<div style={{ height: 200 }} />}>
      <AccountPageContent />
    </Suspense>
  );
}

