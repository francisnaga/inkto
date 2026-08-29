const fs = require("fs");
let appLayout = fs.readFileSync("frontend/src/components/app-layout.tsx", "utf8");

// Fix the + (pathname === '/app' ...) stuff
appLayout = appLayout.replace(/className="text-\[10px\] font-medium  \+ \(pathname === '\/app' \? 'text-\[\#4F46E5\]' : 'text-\[\#94A3B8\]'\}"\>/g, 'className={`text-[10px] font-medium ${pathname === "/app" ? "text-[#4F46E5]" : "text-[#94A3B8]"}`}>');
appLayout = appLayout.replace(/className="text-\[10px\] font-medium  \+ \(pathname === '\/history' \? 'text-\[\#4F46E5\]' : 'text-\[\#94A3B8\]'\}"\>/g, 'className={`text-[10px] font-medium ${pathname === "/history" ? "text-[#4F46E5]" : "text-[#94A3B8]"}`}>');
// Let's also check for templates and account
appLayout = appLayout.replace(/className="text-\[10px\] font-medium  \+ \(pathname === '\/templates' \? 'text-\[\#4F46E5\]' : 'text-\[\#94A3B8\]'\}"\>/g, 'className={`text-[10px] font-medium ${pathname === "/templates" ? "text-[#4F46E5]" : "text-[#94A3B8]"}`}>');
appLayout = appLayout.replace(/className="text-\[10px\] font-medium  \+ \(pathname === '\/account' \? 'text-\[\#4F46E5\]' : 'text-\[\#94A3B8\]'\}"\>/g, 'className={`text-[10px] font-medium ${pathname === "/account" ? "text-[#4F46E5]" : "text-[#94A3B8]"}`}>');

fs.writeFileSync("frontend/src/components/app-layout.tsx", appLayout);
console.log("Fixed app-layout again");
