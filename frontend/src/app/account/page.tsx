'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { apiGet, apiPost } from '@/lib/api';
import Link from 'next/link';
import {
  Loader2, LogOut, ChevronRight, Crown, MessageSquare,
  FileText, Lock, Shield, Phone, Check, User, CreditCard, Globe, HelpCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';

const P = '#5A45FF';
const Ps = '#EDE9FE';
const BORDER = '#E2E8F0';
const TEXT = '#0F172A';
const MUTED = '#64748B';
const CARD_BG = '#FFFFFF';
const PAGE_BG = '#F8FAFC';
const RED = '#EF4444';
const GOLD = '#A6822C';
const UI = '"Inter", -apple-system, sans-serif';
const DISPLAY = '"Poppins", sans-serif';

function InputRow({
  label, value, onChange, placeholder, type = 'text', icon: Icon, onSubmit, saving, saved,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder: string; type?: string; icon?: any;
  onSubmit: (e: React.FormEvent) => void; saving: boolean; saved: boolean;
}) {
  return (
    <form onSubmit={onSubmit}>
      <p style={{ fontSize: 11, fontWeight: 700, color: MUTED, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        {label}
      </p>
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          {Icon && (
            <Icon size={14} color={MUTED} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          )}
          <input
            type={type}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            style={{
              width: '100%', height: 42,
              paddingLeft: Icon ? 34 : 12, paddingRight: 12,
              background: PAGE_BG,
              border: `1.5px solid ${BORDER}`,
              borderRadius: 10, fontSize: 13, color: TEXT,
              outline: 'none', fontFamily: UI, boxSizing: 'border-box',
            }}
            onFocus={e => { e.target.style.borderColor = P; e.target.style.boxShadow = `0 0 0 3px ${Ps}`; }}
            onBlur={e => { e.target.style.borderColor = BORDER; e.target.style.boxShadow = 'none'; }}
          />
        </div>
        <motion.button
          type="submit"
          disabled={saving}
          whileTap={!saving ? { scale: 0.96 } : undefined}
          style={{
            height: 42, padding: '0 16px',
            background: saved ? '#16A34A' : P,
            color: '#fff', border: 'none', borderRadius: 10,
            fontSize: 13, fontWeight: 600,
            cursor: saving ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 5,
            transition: 'background 200ms',
            flexShrink: 0,
          }}
        >
          {saving ? <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} />
           : saved ? <><Check size={13} /> Saved</>
           : 'Save'}
        </motion.button>
      </div>
    </form>
  );
}

function SettingsRow({ icon: Icon, label, href, ext }: { icon: any; label: string; href: string; ext: boolean }) {
  const inner = (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '14px 0', cursor: 'pointer',
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: Ps, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={16} color={P} />
      </div>
      <span style={{ flex: 1, fontSize: 14, color: TEXT, fontWeight: 500 }}>{label}</span>
      <ChevronRight size={16} color={MUTED} />
    </div>
  );

  return ext ? (
    <a href={href} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>{inner}</a>
  ) : (
    <Link href={href} style={{ textDecoration: 'none' }}>{inner}</Link>
  );
}

function AccountPageContent() {
  const { user, loading, logout, setDisplayName } = useAuth();
  const router = useRouter();
  const [plan, setPlan]               = useState<{ status: string; expiresAt: string | null; isPro: boolean }>({ status: 'free', expiresAt: null, isPro: false });
  const [phone, setPhone]             = useState('');
  const [name, setName]               = useState('');
  const [savingPhone, setSavingPhone] = useState(false);
  const [phoneSaved, setPhoneSaved]   = useState(false);
  const [savingName, setSavingName]   = useState(false);
  const [nameSaved, setNameSaved]     = useState(false);
  const [upgrading, setUpgrading]     = useState(false);
  const [loggingOut, setLoggingOut]   = useState(false);
  const searchParams = useSearchParams();
  const upgraded = searchParams.get('upgrade') === 'success';

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    if (user.displayName) setName(user.displayName);
    apiGet('/user-status').then(d => {
        if (d.subscription_status) {
          setPlan({ status: d.subscription_status, expiresAt: d.plan_expires_at, isPro: d.is_pro === true || d.subscription_status === 'active' });
        }
        if (d.phone) setPhone(d.phone);
        if (d.name && !user.displayName) setName(d.name);
      })
      .catch(() => {});
  }, [user]);

  const handleSavePhone = async (e: React.FormEvent) => {
    e.preventDefault(); setSavingPhone(true);
    try {
      const data = await apiPost('/update-profile', { phone });
      if (data) { setPhoneSaved(true); setTimeout(() => setPhoneSaved(false), 3000); }
      else alert('Could not update phone number.');
    } catch { alert('Network error — please try again.'); }
    finally { setSavingPhone(false); }
  };

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault(); setSavingName(true);
    try {
      const data = await apiPost('/update-profile', { name });
        if (data) {
        setDisplayName(name);
        setNameSaved(true);
        setTimeout(() => setNameSaved(false), 3000);
      } else alert('Could not update display name.');
    } catch { alert('Network error — please try again.'); }
    finally { setSavingName(false); }
  };

  const upgrade = async () => {
    setUpgrading(true);
    try {
      const data = await apiPost<{authorization_url?: string, error?: string}>('/checkout', { email: user!.email });
      if (data.authorization_url) window.location.href = data.authorization_url;
      else { alert(data.error || 'Could not start upgrade.'); setUpgrading(false); }
    } catch { alert('Network error.'); setUpgrading(false); }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: PAGE_BG }}>
        <Loader2 size={24} color={P} style={{ animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }
  if (!user) return null;

  const isPro = plan.isPro || plan.status === 'active';
  const displayGreeting = user.displayName || user.email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const initial = displayGreeting[0]?.toUpperCase() ?? 'U';

  const SETTINGS_ROWS = [
    { icon: CreditCard,    label: 'Subscription',     href: isPro ? '#' : '/account?upgrade=1', ext: false },
    { icon: Globe,         label: 'Language',          href: '#',                                 ext: false },
    { icon: HelpCircle,   label: 'Help & Support',    href: 'mailto:support@inkto.jointaccount.org', ext: true },
    { icon: MessageSquare, label: 'Report an issue',   href: 'mailto:support@inkto.jointaccount.org', ext: true },
    { icon: Lock,          label: 'Privacy Policy',    href: '/privacy',                          ext: false },
    { icon: FileText,      label: 'Terms of Service',  href: '/terms',                            ext: false },
    { icon: Shield,        label: 'NDPA 2023 Rights',  href: '/privacy#rights',                   ext: false },
  ];

  return (
    /* KEY FIX: proper scroll container — removes overflow on mobile and browser */
    <div style={{
      minHeight: '100svh',
      background: PAGE_BG,
      overflowY: 'auto',
      paddingBottom: 100,
      fontFamily: UI,
    }}>
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '0 16px' }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          {/* Upgrade success banner */}
          {upgraded && (
            <div style={{
              margin: '16px 0',
              padding: '12px 16px',
              background: '#ECFDF5',
              border: '1px solid #6EE7B7',
              borderRadius: 12,
              fontSize: 13, fontWeight: 600, color: '#065F46',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <Check size={16} /> Payment confirmed — welcome to Pro!
            </div>
          )}

          {/* ── Avatar + Identity ── */}
          <div style={{ paddingTop: 32, paddingBottom: 24, textAlign: 'center' }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: Ps, margin: '0 auto 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 0 0 4px white, 0 0 0 6px ${Ps}`,
            }}>
              <span style={{ fontSize: 28, fontWeight: 700, color: P }}>{initial}</span>
            </div>
            <h1 style={{ fontFamily: DISPLAY, fontSize: 22, fontWeight: 700, color: TEXT, margin: '0 0 4px' }}>
              {displayGreeting}
            </h1>
            <p style={{ fontSize: 13, color: MUTED, margin: 0 }}>{user.email}</p>
            {isPro && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                marginTop: 8, padding: '3px 10px',
                background: '#FEF3C7', borderRadius: 20,
                fontSize: 11, fontWeight: 700, color: GOLD,
              }}>
                <Crown size={11} /> Pro Plan
              </span>
            )}
          </div>

          {/* ── Profile Card ── */}
          <div style={{
            background: CARD_BG, border: `1px solid ${BORDER}`,
            borderRadius: 16, padding: '20px 16px',
            marginBottom: 12,
          }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: MUTED, margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Profile
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <InputRow
                label="Display Name"
                value={name}
                onChange={setName}
                placeholder="e.g. Alex Johnson"
                icon={User}
                onSubmit={handleSaveName}
                saving={savingName}
                saved={nameSaved}
              />
              <div style={{ height: 1, background: BORDER }} />
              <InputRow
                label="Contact Phone (optional)"
                value={phone}
                onChange={setPhone}
                placeholder="e.g. 08012345678"
                type="tel"
                icon={Phone}
                onSubmit={handleSavePhone}
                saving={savingPhone}
                saved={phoneSaved}
              />
            </div>
          </div>

          {/* ── Plan Card ── */}
          {!isPro && (
            <div style={{
              background: '#0D0E14', border: `1px solid rgba(90,69,255,0.3)`,
              borderRadius: 16, padding: '20px 16px',
              marginBottom: 12,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <p style={{ fontFamily: DISPLAY, fontSize: 16, fontWeight: 700, color: '#fff', margin: '0 0 4px' }}>
                    Go Pro
                  </p>
                  <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>Unlock all features</p>
                </div>
                <Crown size={20} color={GOLD} />
              </div>
              {[
                'Unlimited document scanning',
                'Unlimited text conversions',
                'Unlimited history',
                'Voice-to-text dictation',
                'Priority AI processing',
              ].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Check size={14} color={P} />
                  <span style={{ fontSize: 13, color: '#CBD5E1' }}>{f}</span>
                </div>
              ))}
              <motion.button
                onClick={upgrade}
                disabled={upgrading}
                whileTap={!upgrading ? { scale: 0.97 } : undefined}
                style={{
                  width: '100%', height: 44, marginTop: 12,
                  background: P, border: 'none', borderRadius: 12,
                  fontSize: 14, fontWeight: 700, color: '#fff',
                  cursor: upgrading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: '0 4px 16px rgba(90,69,255,0.4)',
                }}
              >
                {upgrading && <Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} />}
                Upgrade Now — ₦5,000/mo
              </motion.button>
            </div>
          )}

          {/* ── Settings List ── */}
          <div style={{
            background: CARD_BG, border: `1px solid ${BORDER}`,
            borderRadius: 16, padding: '4px 16px',
            marginBottom: 12,
          }}>
            {SETTINGS_ROWS.map((item, i) => (
              <div key={item.label}>
                {i > 0 && <div style={{ height: 1, background: BORDER }} />}
                <SettingsRow {...item} />
              </div>
            ))}
          </div>

          {/* ── Legal note ── */}
          <p style={{ fontSize: 11, color: MUTED, lineHeight: 1.7, marginBottom: 16, textAlign: 'center' }}>
            Inkto is a productivity tool, not a law firm and does not provide legal advice.
            All AI-generated transcripts must be independently verified before legal use.
          </p>

          {/* ── Sign Out ── */}
          <motion.button
            onClick={async () => { setLoggingOut(true); await logout(); router.push('/login'); }}
            disabled={loggingOut}
            whileTap={!loggingOut ? { scale: 0.97 } : undefined}
            style={{
              width: '100%', height: 48, marginBottom: 32,
              background: 'none',
              border: `1.5px solid ${RED}`,
              borderRadius: 12,
              fontSize: 14, fontWeight: 600, color: RED,
              cursor: loggingOut ? 'not-allowed' : 'pointer',
              fontFamily: UI,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {loggingOut
              ? <Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} />
              : <LogOut size={15} />}
            {loggingOut ? 'Signing out…' : 'Sign Out'}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100svh', background: '#F8FAFC' }} />}>
      <AccountPageContent />
    </Suspense>
  );
}
