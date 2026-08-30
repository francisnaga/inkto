'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiGet, apiPost } from '@/lib/api';

interface AuthUser {
  email: string;
  displayName?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setDisplayName: (name: string) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
  refreshUser: async () => {},
  setDisplayName: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('inkto_session');
      const email = localStorage.getItem('inkto_user_email');
      const displayName = localStorage.getItem('inkto_display_name') || undefined;
      if (token && email) {
        return { email, displayName };
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

      try {
        const data = await apiGet<{email: string; name?: string; credits?: number; subscription?: any}>('/user-status');
        if (data && data.email) {
          if (typeof window !== 'undefined') {
            localStorage.setItem('inkto_user_email', data.email);
            if (data.name) localStorage.setItem('inkto_display_name', data.name);
          }
          setUser(prev => ({ email: data.email, displayName: data.name || prev?.displayName }));
          return;
        }
      } catch (e: any) {
        if (e.message?.includes('401') || e.status === 401 || (e.response && e.response.status === 401)) {
          // Attempt refresh!
          const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('inkto_refresh_token') : null;
          if (refreshToken) {
            try {
              const refreshData = await apiPost<{sessionToken: string; refreshToken?: string}>('/refresh-session', { refreshToken });
              if (refreshData && refreshData.sessionToken) {
                localStorage.setItem('inkto_session', refreshData.sessionToken);
                if (refreshData.refreshToken) {
                  localStorage.setItem('inkto_refresh_token', refreshData.refreshToken);
                }
                // Retry verification
                const retryData = await apiGet<{email: string; name?: string; credits?: number; subscription?: any}>('/user-status');
                if (retryData && retryData.email) {
                  localStorage.setItem('inkto_user_email', retryData.email);
                  if (retryData.name) localStorage.setItem('inkto_display_name', retryData.name);
                  setUser(prev => ({ email: retryData.email, displayName: retryData.name || prev?.displayName }));
                  return;
                }
              }
            } catch (err) {
              console.error('Refresh failed', err);
            }
          }
          
          // Only clear if refresh explicitly failed or no refresh token
          if (typeof window !== 'undefined') {
            localStorage.removeItem('inkto_session');
            localStorage.removeItem('inkto_refresh_token');
            localStorage.removeItem('inkto_user_email');
          }
          setUser(null);
        }
      }
    } catch (e) {
      console.error('refreshUser error:', e);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      if (typeof window === 'undefined') return;

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

      if (window.location.search) {
        try {
          const searchParams = new URLSearchParams(window.location.search);
          const code = searchParams.get('code');
          const token_hash = searchParams.get('token_hash');
          const type = searchParams.get('type') || undefined;

          if (code || token_hash) {
            try {
              const exData = await apiPost<{sessionToken: string; refreshToken?: string; email?: string; name?: string}>('/exchange-code', { code, token_hash, type });
              if (exData && exData.sessionToken) {
                localStorage.setItem('inkto_session', exData.sessionToken);
                if (exData.refreshToken) {
                  localStorage.setItem('inkto_refresh_token', exData.refreshToken);
                }
                if (exData.email) {
                  localStorage.setItem('inkto_user_email', exData.email);
                }
                if (exData.name) {
                  localStorage.setItem('inkto_display_name', exData.name);
                }
                window.history.replaceState(null, '', window.location.pathname);
              }
            } catch (err) {
              console.error('Exchange code failed', err);
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
      await apiPost('/logout', {});
    } catch {}
    if (typeof window !== 'undefined') {
      localStorage.removeItem('inkto_session');
      localStorage.removeItem('inkto_refresh_token');
      localStorage.removeItem('inkto_user_email');
      localStorage.removeItem('inkto_display_name');
    }
    setUser(null);
  };

  const setDisplayName = (name: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('inkto_display_name', name);
    }
    setUser((prev) => (prev ? { ...prev, displayName: name } : null));
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, refreshUser, setDisplayName }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
