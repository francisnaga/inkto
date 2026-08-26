'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, FileText, Clock, User } from 'lucide-react';

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

  // Hidden on routes that have their own full-screen UI
  const hidden = ['/', '/login', '/verify'].includes(pathname);
  if (hidden) return null;

  return (
    <>
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
          /* No blur, no glass — letterhead aesthetic */
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
            return (
              <Link
                key={name}
                href={href}
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
                  <Icon
                    size={18}
                    color={active ? C.active : C.inactive}
                    strokeWidth={active ? 2.5 : 1.8}
                  />
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
