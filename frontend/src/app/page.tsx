'use client';

import { useState, useEffect } from 'react';
import LandingPage from '@/components/landing-page';
import Onboarding from '@/components/onboarding';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const [onboarded, setOnboarded] = useState<boolean | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('inkto_onboarded') === 'true';
    }
    return null;
  });
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If signed in, skip directly to app home immediately
    if (user) {
      router.replace('/app');
      return;
    }
    
    // Check onboarding status if not yet determined
    if (onboarded === null && typeof window !== 'undefined') {
      const status = localStorage.getItem('inkto_onboarded') === 'true';
      setOnboarded(status);
    }
  }, [user, onboarded, router]);

  // If user is already signed in, never render landing page or onboarding
  if (user) {
    return <div style={{ minHeight: '100vh', background: '#FBFAF7' }} />;
  }

  if (loading || onboarded === null) {
    return <div style={{ minHeight: '100vh', background: '#FBFAF7' }} />;
  }

  if (!onboarded) {
    return (
      <Onboarding
        onComplete={() => {
          localStorage.setItem('inkto_onboarded', 'true');
          router.replace('/login');
        }}
      />
    );
  }

  return <LandingPage />;
}
