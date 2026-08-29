'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

if (typeof window !== 'undefined' && !(window as any).__fetch_intercepted__) {
  (window as any).__fetch_intercepted__ = true;
  const originalFetch = window.fetch;
  window.fetch = async function (input, init) {
    if (typeof input === 'string' && input.startsWith('/api/')) {
      const token = localStorage.getItem('inkto_session');
      if (token) {
        init = init || {};
        init.headers = init.headers || {};
        if (init.headers instanceof Headers) {
          if (!init.headers.has('Authorization')) {
            init.headers.set('Authorization', `Bearer ${token}`);
          }
          if (!init.headers.has('X-Inkto-Auth')) {
            init.headers.set('X-Inkto-Auth', token);
          }
        } else if (Array.isArray(init.headers)) {
          const hasAuth = init.headers.some(([k]) => k.toLowerCase() === 'authorization');
          if (!hasAuth) {
            init.headers.push(['Authorization', `Bearer ${token}`]);
          }
          const hasX = init.headers.some(([k]) => k.toLowerCase() === 'x-inkto-auth');
          if (!hasX) {
            init.headers.push(['X-Inkto-Auth', token]);
          }
        } else {
          const headersObj = init.headers as Record<string, string>;
          if (!headersObj['Authorization'] && !headersObj['authorization']) {
            headersObj['Authorization'] = `Bearer ${token}`;
          }
          if (!headersObj['X-Inkto-Auth'] && !headersObj['x-inkto-auth']) {
            headersObj['X-Inkto-Auth'] = token;
          }
        }
      }
    }
    return originalFetch.call(this, input, init);
  };
}

interface AuthUser {
  email: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('inkto_session');
      const email = localStorage.getItem('inkto_user_email');
      if (token && email) {
        return { email };
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('inkto_session') : null;
      if (!token) {
        setUser(null);
        return;
      }

      const headers: Record<string, string> = { 'Authorization': `Bearer ${token}` };
      const res = await fetch(`https://inkto.jointaccount.org/api/user-status?t=${Date.now()}`, { credentials: 'include', headers });

      if (res.ok) {
        const data = await res.json();
        if (data.email) {
          if (typeof window !== 'undefined') {
            localStorage.setItem('inkto_user_email', data.email);
          }
          setUser({ email: data.email });
          return;
        }
      } else if (res.status === 401) {
        // Attempt refresh!
        const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('inkto_refresh_token') : null;
        if (refreshToken) {
          const refreshRes = await fetch('https://inkto.jointaccount.org/api/refresh-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken })
          });
          if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            if (refreshData.sessionToken) {
              localStorage.setItem('inkto_session', refreshData.sessionToken);
              if (refreshData.refreshToken) {
                localStorage.setItem('inkto_refresh_token', refreshData.refreshToken);
              }
              // Retry verification
              const retryRes = await fetch(`https://inkto.jointaccount.org/api/user-status?t=${Date.now()}`, {
                credentials: 'include',
                headers: { 'Authorization': `Bearer ${refreshData.sessionToken}` }
              });
              if (retryRes.ok) {
                const retryData = await retryRes.json();
                if (retryData.email) {
                  localStorage.setItem('inkto_user_email', retryData.email);
                  setUser({ email: retryData.email });
                  return;
                }
              }
            }
          }
        }
        // Only clear if refresh explicitly failed
        if (typeof window !== 'undefined') {
          localStorage.removeItem('inkto_session');
          localStorage.removeItem('inkto_refresh_token');
          localStorage.removeItem('inkto_user_email');
        }
        setUser(null);
      }
    } catch (e) {
      console.error('refreshUser error:', e);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      if (typeof window === 'undefined') return;

      // 1. Check if Supabase redirected with access_token / refresh_token in URL hash
      if (window.location.hash) {
        try {
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          if (accessToken) {
            localStorage.setItem('inkto_session', accessToken);
            if (refreshToken) {
              localStorage.setItem('inkto_refresh_token', refreshToken);
            }
            window.history.replaceState(null, '', window.location.pathname);
          }
        } catch (e) {
          console.error('Hash parsing error:', e);
        }
      }

      // 2. Check if Supabase redirected with ?code= or ?token_hash= in URL query params
      if (window.location.search) {
        try {
          const searchParams = new URLSearchParams(window.location.search);
          const code = searchParams.get('code');
          const token_hash = searchParams.get('token_hash');
          const type = searchParams.get('type') || undefined;

          if (code || token_hash) {
            const exRes = await fetch('https://inkto.jointaccount.org/api/exchange-code', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ code, token_hash, type })
            });
            if (exRes.ok) {
              const exData = await exRes.json();
              if (exData.sessionToken) {
                localStorage.setItem('inkto_session', exData.sessionToken);
              }
              if (exData.refreshToken) {
                localStorage.setItem('inkto_refresh_token', exData.refreshToken);
              }
              if (exData.email) {
                localStorage.setItem('inkto_user_email', exData.email);
              }
              window.history.replaceState(null, '', window.location.pathname);
            }
          }
        } catch (e) {
          console.error('Query code exchange error:', e);
        }
      }

      await refreshUser();
    };

    initAuth().finally(() => setLoading(false));
  }, []);

  const logout = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('inkto_session') : null;
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      await fetch('https://inkto.jointaccount.org/api/logout', { method: 'POST', credentials: 'include', headers });
    } catch {}
    if (typeof window !== 'undefined') {
      localStorage.removeItem('inkto_session');
      localStorage.removeItem('inkto_refresh_token');
      localStorage.removeItem('inkto_user_email');
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
