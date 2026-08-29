const fs = require("fs");

let appPage = fs.readFileSync('frontend/src/app/app/page.tsx', 'utf8');
appPage = appPage.replace(/className=\{flex items-center p-4 hover:bg-\[\#F8FAFC\] transition-colors `\$\{isActive \? 'bg-\[\#F1F5F9\]' : ''\}` \}/g, 'className={`flex items-center p-4 hover:bg-[#F8FAFC] transition-colors ${isActive ? "bg-[#F1F5F9]" : ""}`}');
// Missing closing tag in app/page.tsx?
// "Error: Expected '</', got '<eof>'"
let openDivs = (appPage.match(/<div/g) || []).length;
let closeDivs = (appPage.match(/<\/div>/g) || []).length;
if (openDivs > closeDivs) {
    appPage = appPage.replace(/<\/Suspense>/, '</div></Suspense>');
} else if (closeDivs > openDivs) {
    appPage = appPage.replace(/<\/div><\/Suspense>/, '</Suspense>');
}
fs.writeFileSync('frontend/src/app/app/page.tsx', appPage);

let templatesPage = fs.readFileSync('frontend/src/app/templates/page.tsx', 'utf8');
templatesPage = templatesPage.replace(/className=\{`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ` \+ \(fitSourceMode === 'paste' \? 'bg-white text-\[\#0F172A\] shadow-sm' : 'text-\[\#64748B\] hover:text-\[\#0F172A\]'\)\}/g, "className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${fitSourceMode === 'paste' ? 'bg-white text-[#0F172A] shadow-sm' : 'text-[#64748B] hover:text-[#0F172A]'}`}");
templatesPage = templatesPage.replace(/className=\{`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ` \+ \(fitSourceMode === 'history' \? 'bg-white text-\[\#0F172A\] shadow-sm' : 'text-\[\#64748B\] hover:text-\[\#0F172A\]'\)\}/g, "className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${fitSourceMode === 'history' ? 'bg-white text-[#0F172A] shadow-sm' : 'text-[#64748B] hover:text-[#0F172A]'}`}");
fs.writeFileSync('frontend/src/app/templates/page.tsx', templatesPage);

let layoutCode = fs.readFileSync('frontend/src/components/app-layout.tsx', 'utf8');
layoutCode = layoutCode.replace(/\x0Clex/g, "`flex");
layoutCode = layoutCode.replace(/className=\{`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium \}\n\s*\+ \(isActive \? 'bg-\[\#E0E7FF\] text-\[\#4F46E5\]' : 'text-\[\#64748B\] hover:bg-\[\#F8FAFC\]'\)/, "className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium ${isActive ? 'bg-[#E0E7FF] text-[#4F46E5]' : 'text-[#64748B] hover:bg-[#F8FAFC]'}`}");
fs.writeFileSync('frontend/src/components/app-layout.tsx', layoutCode);

let historyCode = fs.readFileSync('frontend/src/app/history/page.tsx', 'utf8');
historyCode = historyCode.replace(/\x0Clex/g, "flex");
historyCode = historyCode.replace(/className=\{`flex items-start p-4 transition-colors `\}/, "className={`flex items-start p-4 transition-colors`}");
fs.writeFileSync('frontend/src/app/history/page.tsx', historyCode);

let cssCode = fs.readFileSync('frontend/src/app/globals.css', 'utf8');
// For some reason there is a BOM or invalid character at the start of globals.css?
cssCode = cssCode.replace(/^\uFEFF/, '');
// Or there's a dangling combinator? Let's just restore globals.css to a standard tailwind setup.
let cleanCss = `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n:root {\n  --font-sans: 'Inter', sans-serif;\n  --font-display: 'Poppins', sans-serif;\n}\n\nbody {\n  background-color: #F8FAFC;\n  color: #0F172A;\n}`;
fs.writeFileSync('frontend/src/app/globals.css', cleanCss);

console.log("Fixed 3");
