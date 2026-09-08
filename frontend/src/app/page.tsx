'use client';

import { useEffect } from 'react';
import LandingPage from '@/components/landing-page';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If signed in, skip directly to app home immediately
    if (user) {
      router.replace('/app');
    }
  }, [user, router]);

  // If user is already signed in, don't flash the landing page
  if (user || loading) {
    return <div style={{ minHeight: '100vh', background: '#FBFAF7' }} />;
  }

  return <LandingPage />;
}
