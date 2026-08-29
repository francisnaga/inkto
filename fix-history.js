const fs = require("fs");
let content = fs.readFileSync("frontend/src/app/history/page.tsx", "utf8");
content = content.replace(/className="px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors border \}/g, "className={`px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors border ${isActive ? 'bg-[#0F172A] text-white border-transparent' : 'bg-white text-[#64748B] border-[#E2E8F0] hover:bg-[#F8FAFC] hover:text-[#0F172A]'}`}");
fs.writeFileSync("frontend/src/app/history/page.tsx", content);
console.log("Fixed history");
