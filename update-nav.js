const fs = require("fs");
let content = fs.readFileSync("frontend/src/components/app-layout.tsx", "utf8");

// We need to import useState
if (!content.includes("import { useState } from 'react';")) {
    content = content.replace(/import \{ usePathname, useRouter \} from 'next\/navigation';/, "import { usePathname, useRouter } from 'next/navigation';\nimport { useState } from 'react';");
}

// Add state for FAB
content = content.replace(/const router = useRouter\(\);/, "const router = useRouter();\n  const [isFabOpen, setIsFabOpen] = useState(false);");

// Rewrite the mobile bottom navigation and add the FAB
const oldNav = /\{\/\* Mobile Bottom Navigation \*\/\}[\s\S]*?<\/nav>/;

const newNav = `{/* Floating Action Button (Mobile) */}
      <div className="md:hidden fixed bottom-20 right-4 z-50 flex flex-col items-end gap-3">
        {/* Quick Actions */}
        <div 
          className={\`flex flex-col items-end gap-3 transition-all duration-300 origin-bottom \${isFabOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-90 pointer-events-none'}\`}
        >
          <button 
            onClick={(e) => {
              setIsFabOpen(false);
              if (pathname === '/app') {
                  e.preventDefault();
                  window.dispatchEvent(new CustomEvent('inkto-scan-trigger'));
              } else {
                  router.push('/app?scan=true');
              }
            }}
            className="flex items-center gap-2 bg-[#4F46E5] text-white px-4 py-2.5 rounded-2xl shadow-lg shadow-[#4F46E5]/30 hover:bg-[#4338CA] transition-colors"
          >
            <span className="font-semibold text-sm">Scan</span>
            <Plus size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Toggle FAB */}
        <button 
          onClick={() => setIsFabOpen(!isFabOpen)}
          className="w-14 h-14 bg-[#4F46E5] rounded-[20px] flex items-center justify-center text-white shadow-lg shadow-[#4F46E5]/40 hover:bg-[#4338CA] active:scale-95 transition-all duration-300"
        >
          <Plus 
            size={28} 
            strokeWidth={2.5} 
            className={\`transition-transform duration-300 \${isFabOpen ? 'rotate-45' : 'rotate-0'}\`} 
          />
        </button>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#E2E8F0] shadow-[0_-4px_20px_rgba(0,0,0,0.04)] z-40 px-2 pb-safe pt-2">
        <div className="flex justify-between items-center h-14 px-4">
          <Link href="/app" className="flex flex-col items-center gap-1 w-16">
            <LayoutDashboard size={22} className={pathname === '/app' ? 'text-[#4F46E5]' : 'text-[#94A3B8]'} />
            <span className={\`text-[10px] font-medium \${pathname === '/app' ? 'text-[#4F46E5]' : 'text-[#94A3B8]'}\`}>Home</span>
          </Link>
          <Link href="/history" className="flex flex-col items-center gap-1 w-16">
            <Folder size={22} className={pathname === '/history' ? 'text-[#4F46E5]' : 'text-[#94A3B8]'} />
            <span className={\`text-[10px] font-medium \${pathname === '/history' ? 'text-[#4F46E5]' : 'text-[#94A3B8]'}\`}>Files</span>
          </Link>
          <Link href="/templates" className="flex flex-col items-center gap-1 w-16">
            <FileText size={22} className={pathname === '/templates' ? 'text-[#4F46E5]' : 'text-[#94A3B8]'} />
            <span className={\`text-[10px] font-medium \${pathname === '/templates' ? 'text-[#4F46E5]' : 'text-[#94A3B8]'}\`}>Templates</span>
          </Link>
          <Link href="/account" className="flex flex-col items-center gap-1 w-16">
            <User size={22} className={pathname === '/account' ? 'text-[#4F46E5]' : 'text-[#94A3B8]'} />
            <span className={\`text-[10px] font-medium \${pathname === '/account' ? 'text-[#4F46E5]' : 'text-[#94A3B8]'}\`}>Profile</span>
          </Link>
        </div>
      </nav>`;

content = content.replace(oldNav, newNav);

fs.writeFileSync("frontend/src/components/app-layout.tsx", content);
console.log("Updated mobile nav");
