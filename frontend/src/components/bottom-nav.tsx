'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Home, FileText, Clock, User, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

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
      {/* Premium top loading progress bar — fixed: now has a width */}
      {navigatingTo && (
        <motion.div
          initial={{ scaleX: 0, opacity: 1 }}
          animate={{ scaleX: [0, 0.7, 1], opacity: [1, 1, 0] }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: C.active,
            zIndex: 99999,
            transformOrigin: 'left',
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
            position: 'relative',
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
                  position: 'relative',
                }}
              >
                <motion.div
                  whileTap={{ scale: 0.85 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  style={{
                    width: 36,
                    height: 28,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 8,
                    position: 'relative',
                  }}
                >
                  {/* Animated background pill — slides between tabs via layoutId */}
                  {active && (
                    <motion.div
                      layoutId="nav-active-pill"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: 8,
                        background: C.activeBg,
                      }}
                    />
                  )}
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    {isLoadingThis ? (
                      <Loader2
                        size={18}
                        color={C.active}
                        style={{ animation: 'spin 1s linear infinite' }}
                      />
                    ) : (
                      <Icon
                        size={18}
                        color={active ? C.active : C.inactive}
                        strokeWidth={active ? 2.5 : 1.8}
                      />
                    )}
                  </div>
                </motion.div>
                <motion.span
                  animate={{
                    color: active ? C.active : C.inactive,
                    fontWeight: active ? 700 : 500,
                  }}
                  transition={{ duration: 0.15 }}
                  style={{
                    fontSize: 10,
                    letterSpacing: '0.01em',
                    lineHeight: 1,
                    fontFamily: '-apple-system, "Segoe UI", Roboto, sans-serif',
                  }}
                >
                  {name}
                </motion.span>
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
