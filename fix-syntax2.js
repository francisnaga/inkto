const fs = require("fs");

// Fix app-layout.tsx
let appLayout = fs.readFileSync('frontend/src/components/app-layout.tsx', 'utf8');
appLayout = appLayout.replace(/className=\{\x0Clex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium \}\n\s*\+ \(isActive \? 'bg-\[\#E0E7FF\] text-\[\#4F46E5\]' : 'text-\[\#64748B\] hover:bg-\[\#F8FAFC\]'\)/, "className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium ${isActive ? 'bg-[#E0E7FF] text-[#4F46E5]' : 'text-[#64748B] hover:bg-[#F8FAFC]'}`}");
fs.writeFileSync('frontend/src/components/app-layout.tsx', appLayout);

// Fix history/page.tsx
let historyPage = fs.readFileSync('frontend/src/app/history/page.tsx', 'utf8');
historyPage = historyPage.replace(/router\.push\(entry\.type === 'draft' \? `\/draft\?id=\$\{entry\.id\} : `\/app\?doc=\$\{entry\.id\}`\);/, "router.push(entry.type === 'draft' ? `/draft?id=${entry.id}` : `/app?doc=${entry.id}`);");
historyPage = historyPage.replace(/className=\{w-8 h-8 flex items-center justify-center rounded-lg bg-\[\#F1F5F9\] text-\[\#64748B\]\}/g, 'className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#F1F5F9] text-[#64748B]"');
historyPage = historyPage.replace(/className=\{w-8 h-8 flex items-center justify-center rounded-lg bg-\[\#4F46E5\] text-white\}/g, 'className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#4F46E5] text-white"');
historyPage = historyPage.replace(/className=\{flex-1 text-sm font-medium border border-\[\#E2E8F0\] rounded-lg px-2 py-1 bg-white focus:outline-none focus:border-\[\#4F46E5\] focus:ring-1 focus:ring-\[\#4F46E5\]\}/g, 'className="flex-1 text-sm font-medium border border-[#E2E8F0] rounded-lg px-2 py-1 bg-white focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]"');
fs.writeFileSync('frontend/src/app/history/page.tsx', historyPage);

// Fix templates/page.tsx
let templatesPage = fs.readFileSync('frontend/src/app/templates/page.tsx', 'utf8');
// Check for unterminated string constants
templatesPage = templatesPage.replace(/prompt: `Fill this template[\s\S]*?DETAILS:\\n\$\{fittingInput\},/g, 'prompt: `Fill this template with the provided details.\\nTEMPLATE:\\n${fittingTemplate.content}\\n\\nDETAILS:\\n${fittingInput}`');
fs.writeFileSync('frontend/src/app/templates/page.tsx', templatesPage);

// Fix app/page.tsx
let appPage = fs.readFileSync('frontend/src/app/app/page.tsx', 'utf8');
appPage = appPage.replace(/href=\{`\/app\?doc=\$\{file\.id\}`\}/g, "href={`/app?doc=${file.id}`}");
appPage = appPage.replace(/className=\{w-10 h-10 rounded-xl flex items-center justify-center mr-4 \$\{isAudio \? 'bg-orange-50 text-orange-500' : 'bg-red-50 text-red-500'\}\}/g, 'className={`w-10 h-10 rounded-xl flex items-center justify-center mr-4 ${isAudio ? "bg-orange-50 text-orange-500" : "bg-red-50 text-red-500"}`}');
fs.writeFileSync('frontend/src/app/app/page.tsx', appPage);

console.log("Fixed again");
