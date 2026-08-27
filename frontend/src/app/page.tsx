'use client';

import { useState, useEffect } from 'react';
import LandingPage from '@/components/landing-page';
import Onboarding from '@/components/onboarding';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const [onboarded, setOnboarded] = useState<boolean | null>(null);
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If signed in, skip directly to app home
    if (!loading && user) {
      router.replace('/app');
      return;
    }
    
    // Check onboarding status
    const status = localStorage.getItem('inkto_onboarded') === 'true';
    setOnboarded(status);
  }, [user, loading, router]);

  if (loading || onboarded === null) {
    return <div style={{ minHeight: '100vh', background: '#FBFAF7' }} />;
  }

  if (!onboarded) {
    return (
      <Onboarding
        onComplete={() => {
          localStorage.setItem('inkto_onboarded', 'true');
          setOnboarded(true);
          router.push('/login');
        }}
      />
    );
  }

  return <LandingPage />;
}
