const fs = require("fs");
let content = fs.readFileSync("frontend/src/components/app-layout.tsx", "utf8");

content = content.replace(/<span className=\{[\s\S]*?ext-\[10px\] font-medium  \+ \(pathname === '\/templates' \? 'text-\[\#4F46E5\]' : 'text-\[\#94A3B8\]'\}\}>Templates<\/span>/, '<span className={`text-[10px] font-medium ${pathname === "/templates" ? "text-[#4F46E5]" : "text-[#94A3B8]"}`}>Templates</span>');

content = content.replace(/<span className=\{[\s\S]*?ext-\[10px\] font-medium  \+ \(pathname === '\/account' \? 'text-\[\#4F46E5\]' : 'text-\[\#94A3B8\]'\}\}>Profile<\/span>/, '<span className={`text-[10px] font-medium ${pathname === "/account" ? "text-[#4F46E5]" : "text-[#94A3B8]"}`}>Profile</span>');

fs.writeFileSync("frontend/src/components/app-layout.tsx", content);
console.log("Fixed tab in app-layout");
