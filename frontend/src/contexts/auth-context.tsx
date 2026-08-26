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
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('inkto_session') : null;
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/history', { credentials: 'include', headers });
      if (res.ok) {
        const data = await res.json();
        if (data.email) {
          setUser({ email: data.email });
          return;
        }
      }
    } catch {}
    setUser(null);
  };

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, []);

  const logout = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('inkto_session') : null;
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      await fetch('/api/logout', { method: 'POST', credentials: 'include', headers });
    } catch {}
    if (typeof window !== 'undefined') {
      localStorage.removeItem('inkto_session');
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
