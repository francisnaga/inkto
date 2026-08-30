const fs = require('fs');

function fix_file(filepath, patterns) {
    let c = fs.readFileSync(filepath, 'utf-8');
    for (const [p, r] of patterns) {
        c = c.replace(p, r);
    }
    fs.writeFileSync(filepath, c, 'utf-8');
}

// 1. account/page.tsx
fix_file('frontend/src/app/account/page.tsx', [
    [/import \{ useAuth \} from '@\/contexts\/auth-context';/g, "import { useAuth } from '@/contexts/auth-context';\nimport { apiGet, apiPost } from '@/lib/api';"],
    [/fetch\(\https:\/\/inkto\.jointaccount\.org\/api\/user-status\?t=\$\{Date\.now\(\)\}\, \{[^\}]+\}\)\s*\.then\(r => r\.json\(\)\)/g, "apiGet('/user-status').then(data => data)"],
    [/const res = await fetch\('https:\/\/inkto\.jointaccount\.org\/api\/update-profile', \{\s*method: 'POST',\s*headers: \{\s*'Content-Type': 'application\/json'\s*\},\s*body: JSON\.stringify\(\{ phone \}\),\s*\}\);\s*if \(res\.ok\) \{/g, "const data = await apiPost('/update-profile', { phone });\n      if (data) {"],
    [/const res = await fetch\('https:\/\/inkto\.jointaccount\.org\/api\/update-profile', \{\s*method: 'POST',\s*headers: \{\s*'Content-Type': 'application\/json'\s*\},\s*body: JSON\.stringify\(\{ name \}\),\s*\}\);\s*if \(res\.ok\) \{/g, "const data = await apiPost('/update-profile', { name });\n        if (data) {"],
    [/const res  = await fetch\('https:\/\/inkto\.jointaccount\.org\/api\/checkout', \{\s*method: 'POST',\s*headers: \{\s*'Content-Type': 'application\/json'\s*\},\s*body: JSON\.stringify\(\{ email: user!\.email \}\),\s*\}\);\s*const data = await res\.json\(\);/g, "const data = await apiPost<{url: string}>('/checkout', { email: user!.email });"]
]);
console.log('fixed account');

// 2. draft/page.tsx
fix_file('frontend/src/app/draft/page.tsx', [
    [/import \{ useAuth \} from '@\/contexts\/auth-context';/g, "import { useAuth } from '@/contexts/auth-context';\nimport { apiGet, apiPost } from '@/lib/api';"],
    [/const res = await fetch\('https:\/\/inkto\.jointaccount\.org\/api\/draft', \{\s*method: 'POST',\s*headers: \{\s*'Content-Type': 'application\/json',\s*\},\s*body: JSON\.stringify\(\{ title, text: content \}\),\s*\}\);\s*if \(res\.ok\) \{\s*const data = await res\.json\(\);/g, "const data = await apiPost('/draft', { title, text: content });\n      if (data) {"]
]);
console.log('fixed draft');

// 3. templates/page.tsx
fix_file('frontend/src/app/templates/page.tsx', [
    [/import \{ useAuth \} from '@\/contexts\/auth-context';/g, "import { useAuth } from '@/contexts/auth-context';\nimport { apiGet, apiPost } from '@/lib/api';"],
    [/const res = await fetch\(endpoint, \{\s*method: 'POST',\s*headers: \{\s*'Content-Type': 'application\/json',\s*\},\s*body: JSON\.stringify\(payload\),\s*\}\);\s*if \(!res\.ok\) throw new Error\('Failed to generate template'\);\s*const data = await res\.json\(\);/g, "const data = await apiPost(endpoint.replace('https://inkto.jointaccount.org/api', ''), payload);"],
    [/const res = await fetch\('https:\/\/inkto\.jointaccount\.org\/api\/history\?limit=15'\);\s*if \(res\.ok\) \{\s*const data = await res\.json\(\);/g, "const data = await apiGet('/history?limit=15');\n        if (data) {"],
    [/const res = await fetch\('https:\/\/inkto\.jointaccount\.org\/api\/draft', \{\s*method: 'POST',\s*headers: \{\s*'Content-Type': 'application\/json',\s*\},\s*body: JSON\.stringify\(\{ title: docTitle, text: data\.text \}\),\s*\}\);\s*if \(res\.ok\) \{\s*const draftData = await res\.json\(\);/g, "const draftData = await apiPost('/draft', { title: docTitle, text: data.text });\n      if (draftData) {"]
]);
console.log('fixed templates');

// 4. components/output-box.tsx
fix_file('frontend/src/components/output-box.tsx', [
    [/import \{ useState, useEffect, useRef \} from 'react';/g, "import { useState, useEffect, useRef } from 'react';\nimport { apiPost } from '@/lib/api';"],
    [/const res = await fetch\(endpoint, \{\s*method: 'POST',\s*headers: \{\s*'Content-Type': 'application\/json',\s*\},\s*body: JSON\.stringify\(payload\),\s*\}\);\s*if \(!res\.ok\) throw new Error\('Failed'\);\s*const data = await res\.json\(\);/g, "const data = await apiPost(endpoint.replace('https://inkto.jointaccount.org/api', ''), payload);"]
]);
console.log('fixed output-box');
