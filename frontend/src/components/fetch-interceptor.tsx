'use client';
import { useEffect } from 'react';
export function FetchInterceptor() {
  useEffect(() => {
    if (typeof window !== 'undefined' && !(window as any)._fetchPatched) {
      (window as any)._fetchPatched = true;
      const originalFetch = window.fetch;
      window.fetch = async (...args) => {
        let [resource, config] = args;
        if (typeof resource === 'string' && resource.includes('inkto.jointaccount.org/api/')) {
          config = config || {};
          config.headers = config.headers || {};
          const token = localStorage.getItem('inkto_session');
          if (token) {
            if (config.headers instanceof Headers) {
              if (!config.headers.has('Authorization')) config.headers.set('Authorization', 'Bearer ' + token);
            } else if (Array.isArray(config.headers)) {
              config.headers.push(['Authorization', 'Bearer ' + token]);
            } else {
              (config.headers as Record<string, string>)['Authorization'] = 'Bearer ' + token;
            }
          }
        }
        return originalFetch(resource, config);
      };
    }
  }, []);
  return null;
}