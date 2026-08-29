const fs = require("fs");
let appLayout = fs.readFileSync("frontend/src/components/app-layout.tsx", "utf8");
// Replace tab + ext with `text
appLayout = appLayout.replace(/className=\{\t+ext-\[10px\] font-medium \+ \(pathname/g, "className={`text-[10px] font-medium ${pathname");
// Fix the ternary part
appLayout = appLayout.replace(/text-\[\#94A3B8\]'\)\}/g, "text-[#94A3B8]'}`}");
fs.writeFileSync("frontend/src/components/app-layout.tsx", appLayout);
console.log("Fixed tab in app-layout");
