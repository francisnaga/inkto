'use client';
import { useEffect } from 'react';
import { App } from '@capacitor/app';
import { useRouter } from 'next/navigation';

export function BackButtonHandler() {
  const router = useRouter();
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform?.()) {
      const sub = App.addListener('backButton', ({ canGoBack }) => {
        if (window.location.pathname !== '/' && window.location.pathname !== '/app' && window.location.pathname !== '/login') {
          router.back();
        } else {
          App.exitApp();
        }
      });
      return () => { sub.then(s => s.remove()); };
    }
  }, [router]);
  return null;
}

