'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, FileText, Clock, User } from 'lucide-react';

const navItems = [
  { name: 'Home',      href: '/app',       icon: Home },
  { name: 'Templates', href: '/templates', icon: FileText },
  { name: 'History',   href: '/history',   icon: Clock },
  { name: 'Account',   href: '/account',   icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  if (pathname === '/' || pathname === '/login' || pathname === '/verify') return null;

  return (
    <>
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderTop: '0.5px solid rgba(0,0,0,0.10)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}>
        <div style={{ display: 'flex', height: 56, alignItems: 'stretch', justifyContent: 'space-around', maxWidth: 448, margin: '0 auto', padding: '0 4px' }}>
          {navItems.map(({ name, href, icon: Icon }) => {
            const isActive = pathname === href || (href !== '/app' && pathname.startsWith(href));
            return (
              <Link key={name} href={href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 3, textDecoration: 'none', minWidth: 0, position: 'relative', transition: 'opacity 0.15s' }}>
                {/* Active indicator dot */}
                {isActive && (
                  <span style={{ position: 'absolute', top: 6, width: 4, height: 4, borderRadius: '50%', background: '#2563EB' }} />
                )}
                <div style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, background: isActive ? 'rgba(37,99,235,0.10)' : 'transparent', transition: 'background 0.2s' }}>
                  <Icon
                    size={20}
                    color={isActive ? '#2563EB' : '#A8A29E'}
                    strokeWidth={isActive ? 2.5 : 1.75}
                    style={{ transition: 'color 0.2s, stroke-width 0.2s' }}
                  />
                </div>
                <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 500, color: isActive ? '#2563EB' : '#A8A29E', letterSpacing: '0.2px', transition: 'color 0.2s', lineHeight: 1 }}>
                  {name}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
      {/* Spacer so content doesn't sit behind the nav */}
      <div style={{ height: 'calc(56px + env(safe-area-inset-bottom, 0px))', flexShrink: 0 }} />
    </>
  );
}
