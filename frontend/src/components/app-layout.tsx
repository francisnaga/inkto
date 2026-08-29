'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Home, Folder, FileText, User, Plus, Mic, Settings, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';
  const isAuthRoute = pathname === '/' || pathname === '/login' || pathname === '/verify' || pathname === '/privacy' || pathname === '/terms';

  const { user, signOut } = useAuth();
  const router = useRouter();

  if (isAuthRoute) {
    return <div className="w-full h-full min-h-screen">{children}</div>;
  }

  const navItems = [
    { name: 'Dashboard', href: '/app', icon: LayoutDashboard },
    { name: 'Files', href: '/history', icon: Folder },
    { name: 'Templates', href: '/templates', icon: FileText },
    { name: 'Draft', href: '/draft', icon: FileText },
    { name: 'Profile', href: '/account', icon: User },
  ];

  return (
    <div className="flex h-screen w-full bg-[#F8FAFC] text-[#0F172A] overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-[#E2E8F0] shadow-sm shrink-0">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center">
            {/* Custom Logo Icon */}
            <img src="/icon-192.png" alt="Inkto Logo" className="w-6 h-6 object-contain" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight">inkto</span>
        </div>
        <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link key={item.name} href={item.href}
                className={lex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium text-sm
                   + (isActive ? 'bg-[#E0E7FF] text-[#4F46E5]' : 'text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]')}
              >
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-[#E2E8F0]">
          <button onClick={() => { signOut(); router.push('/login'); }} className="flex w-full items-center gap-3 px-4 py-3 text-[#64748B] hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium text-sm">
            <LogOut size={18} />
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-[100svh] overflow-hidden relative">
        <div className="flex-1 overflow-y-auto pb-20 md:pb-0 scroll-smooth">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#E2E8F0] shadow-[0_-4px_20px_rgba(0,0,0,0.04)] z-50 px-2 pb-safe pt-2">
        <div className="flex justify-around items-center h-14 relative">
          <Link href="/app" className="flex flex-col items-center gap-1 w-16">
            <LayoutDashboard size={20} className={pathname === '/app' ? 'text-[#4F46E5]' : 'text-[#94A3B8]'} />
            <span className={	ext-[10px] font-medium  + (pathname === '/app' ? 'text-[#4F46E5]' : 'text-[#94A3B8]')}>Home</span>
          </Link>
          <Link href="/history" className="flex flex-col items-center gap-1 w-16">
            <Folder size={20} className={pathname === '/history' ? 'text-[#4F46E5]' : 'text-[#94A3B8]'} />
            <span className={	ext-[10px] font-medium  + (pathname === '/history' ? 'text-[#4F46E5]' : 'text-[#94A3B8]')}>Files</span>
          </Link>

          {/* Center Scan FAB */}
          <div className="w-16 flex justify-center -mt-8">
             <Link href="/app" onClick={(e) => {
                 // Trigger native scan or open modal
                 if (pathname === '/app') {
                     e.preventDefault();
                     window.dispatchEvent(new CustomEvent('inkto-scan-trigger'));
                 }
             }} className="w-14 h-14 bg-[#4F46E5] rounded-full flex items-center justify-center text-white shadow-lg shadow-[#4F46E5]/40 hover:scale-105 active:scale-95 transition-transform">
               <Plus size={28} strokeWidth={2.5} />
             </Link>
          </div>

          <Link href="/templates" className="flex flex-col items-center gap-1 w-16">
            <FileText size={20} className={pathname === '/templates' ? 'text-[#4F46E5]' : 'text-[#94A3B8]'} />
            <span className={	ext-[10px] font-medium  + (pathname === '/templates' ? 'text-[#4F46E5]' : 'text-[#94A3B8]')}>Templates</span>
          </Link>
          <Link href="/account" className="flex flex-col items-center gap-1 w-16">
            <User size={20} className={pathname === '/account' ? 'text-[#4F46E5]' : 'text-[#94A3B8]'} />
            <span className={	ext-[10px] font-medium  + (pathname === '/account' ? 'text-[#4F46E5]' : 'text-[#94A3B8]')}>Profile</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}


