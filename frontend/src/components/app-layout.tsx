'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { Home, Folder, FileText, User, Plus, LogOut, LayoutDashboard, Pencil, Camera } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { InktoWordmark } from '@/components/inkto-logo';
import { motion, AnimatePresence } from 'framer-motion';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';
  const isAuthRoute =
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/verify' ||
    pathname === '/privacy' ||
    pathname === '/terms';

  const { user, logout } = useAuth();
  const router = useRouter();
  const [isFabOpen, setIsFabOpen] = useState(false);

  if (isAuthRoute) {
    return <div className="w-full min-h-screen">{children}</div>;
  }

  const navItems = [
    { name: 'Home',      href: '/app',       icon: LayoutDashboard },
    { name: 'Files',     href: '/history',   icon: Folder },
    { name: 'Templates', href: '/templates', icon: FileText },
    { name: 'Profile',   href: '/account',   icon: User },
  ];

  const initial = user?.displayName
    ? user.displayName[0].toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? 'U';

  const isActiveNav = (href: string) =>
    href === '/app' ? pathname === '/app' : pathname.startsWith(href);

  return (
    <div className="flex h-screen w-full bg-[#F8FAFC] text-[#0F172A] overflow-hidden">

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex flex-col w-60 bg-white border-r border-[#E2E8F0] shadow-sm shrink-0">
        {/* Logo */}
        <div className="px-5 py-4 border-b border-[#E2E8F0]">
          <InktoWordmark size={26} />
        </div>

        {/* New Document */}
        <div className="px-4 pt-4 pb-2">
          <button
            onClick={() => {
              if (pathname === '/app') window.dispatchEvent(new CustomEvent('inkto-scan-trigger'));
              else router.push('/app?scan=true');
            }}
            className="flex items-center justify-center gap-2 w-full h-9 rounded-xl bg-[#5A45FF] text-white text-[13px] font-semibold hover:bg-[#4A38E8] transition-colors shadow-sm"
          >
            <Plus size={15} strokeWidth={2.5} />
            New Document
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = isActiveNav(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-[13px] font-medium ${
                  isActive
                    ? 'bg-[#EDE9FE] text-[#5A45FF]'
                    : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
                }`}
              >
                <Icon size={17} strokeWidth={isActive ? 2.5 : 2} />
                {item.name}
              </Link>
            );
          })}
          <Link
            href="/draft"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-[13px] font-medium ${
              pathname === '/draft'
                ? 'bg-[#EDE9FE] text-[#5A45FF]'
                : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
            }`}
          >
            <Pencil size={17} strokeWidth={pathname === '/draft' ? 2.5 : 2} />
            AI Draft
          </Link>
        </nav>

        {/* User footer */}
        <div className="p-3 border-t border-[#E2E8F0] flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#EDE9FE] flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-[#5A45FF]">{initial}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-[#0F172A] truncate">
              {user?.displayName || user?.email?.split('@')[0]}
            </p>
            <p className="text-[10px] text-[#94A3B8] truncate">{user?.email}</p>
          </div>
          <button
            onClick={async () => { await logout(); router.push('/login'); }}
            className="p-1.5 rounded-lg text-[#94A3B8] hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Sign out"
          >
            <LogOut size={14} />
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 flex flex-col h-[100svh] overflow-hidden relative">
        <div className="flex-1 overflow-y-auto pb-20 md:pb-0 scroll-smooth">
          {children}
        </div>
      </main>

      {/* ── Mobile FAB ── */}
      <div className="md:hidden fixed bottom-[72px] right-4 z-50 flex flex-col items-end gap-2">
        <AnimatePresence>
          {isFabOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 420, damping: 28 }}
              className="flex flex-col items-end gap-2"
            >
              <button
                onClick={() => {
                  setIsFabOpen(false);
                  if (pathname === '/app') window.dispatchEvent(new CustomEvent('inkto-scan-trigger'));
                  else router.push('/app?scan=true');
                }}
                className="flex items-center gap-2 bg-[#5A45FF] text-white px-4 py-2.5 rounded-2xl shadow-lg shadow-[#5A45FF]/30 text-[13px] font-semibold hover:bg-[#4A38E8] active:scale-95 transition-all"
              >
                <Camera size={15} strokeWidth={2} />
                Scan
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setIsFabOpen(!isFabOpen)}
          className="w-14 h-14 bg-[#5A45FF] rounded-[20px] flex items-center justify-center text-white shadow-lg shadow-[#5A45FF]/40 hover:bg-[#4A38E8] active:scale-95 transition-all duration-200"
          aria-label="Quick actions"
        >
          <motion.div
            animate={{ rotate: isFabOpen ? 45 : 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            <Plus size={26} strokeWidth={2.5} />
          </motion.div>
        </button>
      </div>

      {/* ── Mobile Bottom Nav ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#E2E8F0] shadow-[0_-2px_16px_rgba(0,0,0,0.06)] z-40"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex justify-around items-center h-[58px] px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = isActiveNav(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex flex-col items-center gap-[3px] flex-1 py-1 min-w-0"
                onClick={() => setIsFabOpen(false)}
              >
                <Icon
                  size={22}
                  className={isActive ? 'text-[#5A45FF]' : 'text-[#94A3B8]'}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span className={`text-[10px] font-medium leading-none ${isActive ? 'text-[#5A45FF]' : 'text-[#94A3B8]'}`}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

    </div>
  );
}
