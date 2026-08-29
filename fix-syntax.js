const fs = require("fs");

let filesToFix = [
    'frontend/src/app/history/page.tsx',
    'frontend/src/app/app/page.tsx',
    'frontend/src/app/templates/page.tsx',
    'frontend/src/app/layout.tsx'
];

for (let file of filesToFix) {
    let content = fs.readFileSync(file, 'utf8');

    // Fix className={ ... } but ONLY if it starts with a letter (e.g. flex, px-5) and does not contain ` or ' or " at the start
    // Wait, the previous agent literally wrote `className={px-5 py-2 ... transition-colors ${isActive ? 'bg-white' : 'bg-transparent'} border }`
    content = content.replace(/className=\{([^'"\`{}]*?)\}/g, (match, p1) => {
        // Only wrap in backticks if it looks like raw tailwind classes without quotes
        if (p1.trim().match(/^[a-zA-Z0-9-]/)) {
            return `className={\`${p1}\`}`;
        }
        return match;
    });

    // In templates, fix content: ... }
    content = content.replace(/content: (IN THE HIGH COURT[\s\S]*?COMMISSIONER FOR OATHS )\}/g, 'content: `$1` }');
    content = content.replace(/content: (NON-DISCLOSURE[\s\S]*?Receiving Party )\}/g, 'content: `$1` }');
    content = content.replace(/content: (LEASE AGREEMENT[\s\S]*?Tenant )\}/g, 'content: `$1` }');
    content = content.replace(/content: (BOARD RESOLUTION[\s\S]*?DIRECTOR \/ SECRETARY )\}/g, 'content: `$1` }');
    content = content.replace(/content: (\[Your Letterhead\][\s\S]*?\[Lawyer\/Firm Name\] )\}/g, 'content: `$1` }');

    // Also prompt: Fill this template...
    content = content.replace(/prompt: (Fill this template[\s\S]*?DETAILS:\\n\$\{fittingInput\},)/g, 'prompt: `$1`');

    // router.push
    content = content.replace(/router\.push\(entry\.type === 'draft' \? \/draft\?id= : \/app\?doc=\);/g, "router.push(entry.type === 'draft' ? `/draft?id=${entry.id}` : `/app?doc=${entry.id}`);");
    
    // href={/app?doc=}
    content = content.replace(/href=\{\/app\?doc=\}/g, "href={`/app?doc=${file.id}`}");

    // app/page.tsx title logic
    content = content.replace(/name = scan- /g, "name = `scan-`");
    content = content.replace(/ \+ pagesCount \+ p\.pdf;/g, " + pagesCount + `p.pdf`;");

    // Fix layout.tsx inter.variable
    content = content.replace(/className=\{\$\{inter\.variable\} \}/, 'className={`${inter.variable} ${poppins.variable}`}');
    
    // Some lines had `border }` which became `border \`}` which is fine because we replaced the inner part with backticks.
    // Let's also fix the ternary in history/page.tsx
    // `transition-colors ${isActive ? 'bg-[#F1F5F9] text-[#0F172A]' : 'text-[#64748B] hover:bg-[#F8FAFC]'} border }`
    // The previous regex `className=\{([^'"\`{}]*?)\}` might not match if it contains `{` inside (but it didn't contain `{`? Oh wait, `${` has `{`!)
    // Let's do manual replace for the known problematic classNames:
    
    content = content.replace(/className=\{px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors \$\{isActive \? 'bg-\[\#F1F5F9\] text-\[\#0F172A\]' : 'text-\[\#64748B\] hover:bg-\[\#F8FAFC\]'\} border \}/g, "className={`px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${isActive ? 'bg-[#F1F5F9] text-[#0F172A]' : 'text-[#64748B] hover:bg-[#F8FAFC]'} border`}");
    content = content.replace(/className=\{\x0Clex items-start p-4 transition-colors \}/g, "className={`flex items-start p-4 transition-colors`}"); // Fix the ^L (form feed) character!
    content = content.replace(/className=\{shrink-0 w-12 h-12 rounded-xl flex items-center justify-center mr-4 \}/g, "className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center mr-4`}");
    content = content.replace(/className=\{flex items-center p-4 hover:bg-\[\#F8FAFC\] transition-colors \$\{isActive \? 'bg-\[\#F1F5F9\]' : ''\} \}/g, "className={`flex items-center p-4 hover:bg-[#F8FAFC] transition-colors ${isActive ? 'bg-[#F1F5F9]' : ''}`}");
    content = content.replace(/className=\{w-10 h-10 rounded-xl flex items-center justify-center mr-4  \+ \(isAudio \? 'bg-orange-50 text-orange-500' : 'bg-red-50 text-red-500'\)\}/g, "className={`w-10 h-10 rounded-xl flex items-center justify-center mr-4 ${isAudio ? 'bg-orange-50 text-orange-500' : 'bg-red-50 text-red-500'}`}");

    fs.writeFileSync(file, content);
}

console.log("Fixed syntax errors via Node.js");
