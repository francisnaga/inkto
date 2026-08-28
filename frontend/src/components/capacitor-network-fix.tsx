'use client';
import { useEffect } from 'react';

export function CapacitorNetworkFix() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isCapacitor = (window as any).Capacitor !== undefined;
      if (isCapacitor) {
        const originalFetch = window.fetch;
        window.fetch = async function (...args) {
          let [resource, config] = args;
          if (typeof resource === 'string' && resource.startsWith('/api')) {
             resource = 'https://inkto.jointaccount.org' + resource;
          }
          return originalFetch(resource, config);
        };
      }
    }
  }, []);
  return null;
}
