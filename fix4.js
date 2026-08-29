const fs = require("fs");

let filesToFix = [
    'frontend/src/app/history/page.tsx',
    'frontend/src/app/app/page.tsx',
    'frontend/src/app/templates/page.tsx',
    'frontend/src/components/app-layout.tsx'
];

for (let file of filesToFix) {
    let content = fs.readFileSync(file, 'utf8');

    // Fix the broken classNames
    content = content.replace(/className=\{\`([^`$]*?)"\>/g, 'className="$1">');
    content = content.replace(/className=\{\`([^`$]*?)"/g, 'className="$1"');
    
    // Specifically fix history/page.tsx line 211
    content = content.replace(/className=\{\`flex items-start p-4 transition-colors">/g, 'className="flex items-start p-4 transition-colors">');
    content = content.replace(/className=\{\`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center mr-4 ">/g, 'className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center mr-4">');

    // Specifically fix templates/page.tsx
    content = content.replace(/className=\{\`px-4 py-2 text-sm font-semibold rounded-lg transition-colors \$\{fitSourceMode === 'paste' \? 'bg-white text-\[\#0F172A\] shadow-sm' : 'text-\[\#64748B\] hover:text-\[\#0F172A\]'\}"\>/g, "className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${fitSourceMode === 'paste' ? 'bg-white text-[#0F172A] shadow-sm' : 'text-[#64748B] hover:text-[#0F172A]'}`}>");
    content = content.replace(/className=\{\`px-4 py-2 text-sm font-semibold rounded-lg transition-colors \$\{fitSourceMode === 'history' \? 'bg-white text-\[\#0F172A\] shadow-sm' : 'text-\[\#64748B\] hover:text-\[\#0F172A\]'\}"\>/g, "className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${fitSourceMode === 'history' ? 'bg-white text-[#0F172A] shadow-sm' : 'text-[#64748B] hover:text-[#0F172A]'}`}>");

    // Fix app/page.tsx closing Suspense div
    content = content.replace(/<\/div><\/Suspense>/g, '</Suspense>');
    content = content.replace(/<\/Suspense>\n\n\s*\}\n/g, '</Suspense>\n    </div>\n  );\n}\n');

    fs.writeFileSync(file, content);
}
console.log("Fixed manually again");
