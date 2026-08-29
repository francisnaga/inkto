import os
import re

files_to_fix = [
    'frontend/src/app/history/page.tsx',
    'frontend/src/app/app/page.tsx',
    'frontend/src/app/templates/page.tsx',
    'frontend/src/app/layout.tsx'
]

for file in files_to_fix:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Fix className={...} where it lacks quotes/backticks
    content = re.sub(r'className=\{([^{}]*?)\}', lambda m: f'className={{`{m.group(1)}`}}', content)

    # In templates, fix content: ... }
    content = re.sub(r'content: (IN THE HIGH COURT.*?COMMISSIONER FOR OATHS )\}', lambda m: f'content: `{m.group(1)}` }}', content, flags=re.DOTALL)
    content = re.sub(r'content: (NON-DISCLOSURE.*?Receiving Party )\}', lambda m: f'content: `{m.group(1)}` }}', content, flags=re.DOTALL)
    content = re.sub(r'content: (LEASE AGREEMENT.*?Tenant )\}', lambda m: f'content: `{m.group(1)}` }}', content, flags=re.DOTALL)
    content = re.sub(r'content: (BOARD RESOLUTION.*?DIRECTOR / SECRETARY )\}', lambda m: f'content: `{m.group(1)}` }}', content, flags=re.DOTALL)
    content = re.sub(r'content: (\[Your Letterhead\].*?\[Lawyer/Firm Name\] )\}', lambda m: f'content: `{m.group(1)}` }}', content, flags=re.DOTALL)

    # Also prompt: Fill this template...
    content = re.sub(r'prompt: (Fill this template.*?DETAILS:\\n\$\{fittingInput\},)', lambda m: f'prompt: `{m.group(1)}`', content, flags=re.DOTALL)

    # Also router.push(entry.type === 'draft' ? /draft\?id= : /app\?doc=)
    content = re.sub(r"router\.push\(entry\.type === 'draft' \? /draft\?id= : /app\?doc=\);", "router.push(entry.type === 'draft' ? `/draft?id=${entry.id}` : `/app?doc=${entry.id}`);", content)
    
    # Also link href={/app?doc=}
    content = re.sub(r'href=\{/app\?doc=\}', 'href={`/app?doc=${file.id}`}', content)

    # Also app/page.tsx title logic
    content = re.sub(r'name = scan- ', 'name = `scan-`', content)
    content = re.sub(r' \+ pagesCount \+ p\.pdf;', ' + pagesCount + `p.pdf`;', content)

    # Fix some double backticks like className={{`...`}} if it was already correct but we double backticked it?
    # Wait, if we match `className=\{([^{}]*?)\}`, we might match `className={"foo"}`. Let's fix that!
    content = re.sub(r'className=\{\`\"(.*?)\"\`\}', r'className="\1"', content)
    content = re.sub(r'className=\{\`\`(.*?)\`\`\}', r'className={`\1`}', content)
    
    # Actually, any className={{`...`}} that had JS inside like isActive ? 'bg' : 'text' will be broken if we just blindly backtick it.
    
    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)

print("Fixed syntax errors")
