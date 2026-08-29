const fs = require("fs");
let content = fs.readFileSync("frontend/src/components/app-layout.tsx", "utf8");
content = content.replace(/\text/g, '`text');
content = content.replace(/\u0009ext/g, '`text');
content = content.replace(/className=\{\`text-\[10px\] font-medium  \+ \(pathname === '\/templates' \? 'text-\[\#4F46E5\]' : 'text-\[\#94A3B8\]'\}`\}/g, 'className={`text-[10px] font-medium ${pathname === "/templates" ? "text-[#4F46E5]" : "text-[#94A3B8]"}`}');
content = content.replace(/className=\{\`text-\[10px\] font-medium  \+ \(pathname === '\/account' \? 'text-\[\#4F46E5\]' : 'text-\[\#94A3B8\]'\}`\}/g, 'className={`text-[10px] font-medium ${pathname === "/account" ? "text-[#4F46E5]" : "text-[#94A3B8]"}`}');
fs.writeFileSync("frontend/src/components/app-layout.tsx", content);
console.log("Fixed tab in app-layout");
