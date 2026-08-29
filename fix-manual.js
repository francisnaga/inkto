const fs = require("fs");

let layout = fs.readFileSync('frontend/src/components/app-layout.tsx', 'utf8');
layout = layout.replace(/className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium text-sm\s*\+ \(isActive \? 'bg-\[\#E0E7FF\] text-\[\#4F46E5\]' : 'text-\[\#64748B\] hover:bg-\[\#F1F5F9\] hover:text-\[\#0F172A\]'\)\}/, 'className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium text-sm ${isActive ? "bg-[#E0E7FF] text-[#4F46E5]" : "text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]"}`}');
fs.writeFileSync('frontend/src/components/app-layout.tsx', layout);

let history = fs.readFileSync('frontend/src/app/history/page.tsx', 'utf8');
history = history.replace(/className="flex-1 overflow-y-auto">/g, 'className="flex-1 overflow-y-auto">');
history = history.replace(/className="flex flex-col h-full p-6 md:p-8 max-w-5xl mx-auto">/g, 'className="flex flex-col h-full p-6 md:p-8 max-w-5xl mx-auto">');
history = history.replace(/className="relative mb-6">/g, 'className="relative mb-6">');
// Check line 191 of history
// Wait, why did history/page.tsx:191:45 give "Unterminated string constant"?
// Let's print line 191!
