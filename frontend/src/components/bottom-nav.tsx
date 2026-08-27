'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Home, FileText, Clock, User, Loader2 } from 'lucide-react';

const NAV = [
  { name: 'Home',      href: '/app',       Icon: Home },
  { name: 'Templates', href: '/templates', Icon: FileText },
  { name: 'History',   href: '/history',   Icon: Clock },
  { name: 'Account',   href: '/account',   Icon: User },
];

/* Design tokens (inline — kept in sync with globals.css) */
const C = {
  bg:       '#FFFFFF',
  border:   '#E4E1D9',
  active:   '#24467A',   /* Ink Blue */
  inactive: '#9B978E',
  activeBg: '#EEF2F8',   /* Ink Blue subtle */
};

export function BottomNav() {
  const pathname = usePathname();
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);

  // Clear navigating state when route actually changes
  useEffect(() => {
    setNavigatingTo(null);
  }, [pathname]);

  // Strictly show ONLY on the 4 primary app tabs
  const allowedTabs = ['/app', '/templates', '/history', '/account'];
  const shouldShow = allowedTabs.some(tab => pathname === tab || (tab !== '/app' && pathname?.startsWith(tab)));
  if (!shouldShow) return null;

  return (
    <>
      {/* Styles for premium loading and spin animations */}
      <style>{`
        @keyframes nav-loading-bar {
          0% { left: 0; width: 0%; }
          50% { left: 0; width: 70%; }
          100% { left: 100%; width: 0%; }
        }
        @keyframes nav-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      {/* Premium top loading progress bar */}
      {navigatingTo && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            height: 3,
            background: C.active,
            zIndex: 99999,
            animation: 'nav-loading-bar 1.5s infinite ease-in-out',
          }}
        />
      )}

      <nav
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          background: C.bg,
          borderTop: `1px solid ${C.border}`,
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div
          style={{
            display: 'flex',
            height: 52,
            alignItems: 'stretch',
            justifyContent: 'space-around',
            maxWidth: 448,
            margin: '0 auto',
            padding: '0 8px',
          }}
        >
          {NAV.map(({ name, href, Icon }) => {
            const active = pathname === href || (href !== '/app' && pathname.startsWith(href));
            const isLoadingThis = navigatingTo === href;

            return (
              <Link
                key={name}
                href={href}
                onClick={() => {
                  if (pathname !== href) {
                    setNavigatingTo(href);
                  }
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 1,
                  gap: 3,
                  textDecoration: 'none',
                  minWidth: 0,
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 28,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 8,
                    background: active ? C.activeBg : 'transparent',
                    transition: 'background 150ms ease',
                  }}
                >
                  {isLoadingThis ? (
                    <Loader2
                      size={18}
                      color={C.active}
                      style={{ animation: 'nav-spin 1s linear infinite' }}
                    />
                  ) : (
                    <Icon
                      size={18}
                      color={active ? C.active : C.inactive}
                      strokeWidth={active ? 2.5 : 1.8}
                    />
                  )}
                </div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: active ? 700 : 500,
                    color: active ? C.active : C.inactive,
                    letterSpacing: '0.01em',
                    lineHeight: 1,
                    fontFamily: '-apple-system, "Segoe UI", Roboto, sans-serif',
                  }}
                >
                  {name}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
      {/* Spacer so content isn't hidden behind the fixed nav */}
      <div
        id="bottom-nav-spacer"
        style={{
          height: 'calc(52px + env(safe-area-inset-bottom, 0px))',
          flexShrink: 0,
        }}
      />
    </>
  );
}
