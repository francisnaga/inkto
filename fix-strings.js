const fs = require("fs");

let filesToFix = [
    'frontend/src/app/history/page.tsx',
    'frontend/src/app/app/page.tsx',
    'frontend/src/app/templates/page.tsx',
    'frontend/src/components/app-layout.tsx'
];

for (let file of filesToFix) {
    let content = fs.readFileSync(file, 'utf8');

    // Replace className={`...`} with className="..." where there are no variables inside
    content = content.replace(/className=\{`([^$]*?)`\}/g, 'className="$1"');

    // For app-layout, fixing the `+ (pathname` things that I missed!
    content = content.replace(/className=\{`text-\[10px\] font-medium  \+ \(pathname === '\/app' \? 'text-\[\#4F46E5\]' : 'text-\[\#94A3B8\]'\)`\}/g, 'className={`text-[10px] font-medium ${pathname === "/app" ? "text-[#4F46E5]" : "text-[#94A3B8]"}`}');
    content = content.replace(/className=\{`text-\[10px\] font-medium  \+ \(pathname === '\/history' \? 'text-\[\#4F46E5\]' : 'text-\[\#94A3B8\]'\)`\}/g, 'className={`text-[10px] font-medium ${pathname === "/history" ? "text-[#4F46E5]" : "text-[#94A3B8]"}`}');
    
    fs.writeFileSync(file, content);
}
console.log("Fixed string literals");
