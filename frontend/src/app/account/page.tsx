'use client';

import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { User, LogOut, ChevronRight, Loader2 } from 'lucide-react';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function AccountPageContent() {
  const { user, loading, logout } = useAuth();
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [planStatus, setPlanStatus] = useState<{ status: string; expiresAt: string | null }>({ status: 'free', expiresAt: null });
  const searchParams = useSearchParams();
  const upgradeSuccess = searchParams.get('upgrade') === 'success';

  useEffect(() => {
    if (user) {
      fetch('/api/user-status', { credentials: 'include' })
        .then(r => r.json())
        .then(data => {
          if (data.subscription_status) {
            setPlanStatus({ status: data.subscription_status, expiresAt: data.plan_expires_at });
          }
        })
        .catch(() => {});
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col h-full pt-16 pb-4 items-center text-center">
        <User className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold tracking-tight mb-2">Account</h2>
        <p className="text-muted-foreground text-sm mb-8 max-w-xs">
          Sign in to manage your subscription and settings.
        </p>
        <Link href="/login">
          <Button size="lg" className="w-full">Sign in</Button>
        </Link>
      </div>
    );
  }

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email })
      });
      const data = await res.json();
      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        alert(data.error || 'Failed to start upgrade process');
        setIsUpgrading(false);
      }
    } catch (e) {
      alert('Network error. Please try again.');
      setIsUpgrading(false);
    }
  };

  const isPro = planStatus.status === 'active' && (!planStatus.expiresAt || new Date(planStatus.expiresAt) > new Date());

  return (
    <div className="flex flex-col h-full pt-8 pb-4">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Account</h1>
      </header>

      {upgradeSuccess && (
        <div className="mb-6 p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-800 font-medium">
          Payment received! Your account is being upgraded.
        </div>
      )}

      {/* User info */}
      <div className="p-4 rounded-xl border bg-card mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{user.email}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{isPro ? 'Pro Plan' : 'Free Plan'}</p>
          </div>
        </div>
      </div>

      {/* Plan */}
      <div className="rounded-xl border bg-muted/40 p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">{isPro ? 'Pro Plan' : 'Free Plan'}</h3>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Current</span>
        </div>
        <ul className="text-xs text-muted-foreground space-y-1.5 mb-4">
          <li>✓ Unlimited document scanning</li>
          <li>{isPro ? '✓ Unlimited text conversions' : '✓ 5 text conversions per day'}</li>
          <li>{isPro ? '✓ Unlimited history' : '✓ 7-day history'}</li>
          <li className={isPro ? '' : 'text-muted-foreground/60'}>{isPro ? '✓ Voice-to-text (coming soon)' : '✗ Voice-to-text'}</li>
        </ul>
        
        {!isPro && (
          <Button 
            className="w-full" 
            size="sm" 
            onClick={handleUpgrade} 
            disabled={isUpgrading}
          >
            {isUpgrading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Upgrade to Pro (₦5,000/mo)
          </Button>
        )}
        
        {isPro && planStatus.expiresAt && (
          <p className="text-xs text-center mt-2 text-muted-foreground">
            Renews {new Date(planStatus.expiresAt).toLocaleDateString()}
          </p>
        )}
      </div>

      {/* Settings */}
      <div className="rounded-xl border divide-y mb-6">
        <a
          href="mailto:support@inkto.jointaccount.org"
          className="flex items-center justify-between p-4 text-sm font-medium hover:bg-muted/40 transition-colors"
        >
          Report an issue <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </a>
      </div>

      {/* Sign out */}
      <Button
        variant="outline"
        className="w-full text-destructive border-destructive/30 hover:bg-destructive/5"
        onClick={logout}
      >
        <LogOut className="w-4 h-4 mr-2" />
        Sign out
      </Button>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
      <AccountPageContent />
    </Suspense>
  );
}
