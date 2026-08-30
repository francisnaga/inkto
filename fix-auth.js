const fs = require('fs');
let c = fs.readFileSync('frontend/src/app/login/page.tsx', 'utf-8');
c = c.replace(/import \{ useAuth \} from '.*?auth-context';/, "import { useAuth } from '@/contexts/auth-context';\nimport { apiPost } from '@/lib/api';");
c = c.replace(/const res\s*=\s*await fetch\('https:\/\/inkto\.jointaccount\.org\/api\/send-otp', \{\s*method: 'POST',\s*headers: \{\s*'Content-Type': 'application\/json',\s*\},\s*body: JSON\.stringify\(\{ email \}\),\s*\}\);\s*const data = await res\.json\(\);/, "const data = await apiPost('/send-otp', { email });\n      const res = { ok: true }; // shim");
fs.writeFileSync('frontend/src/app/login/page.tsx', c);

let v = fs.readFileSync('frontend/src/app/verify/page.tsx', 'utf-8');
v = v.replace(/import \{ useAuth \} from '.*?auth-context';/, "import { useAuth } from '@/contexts/auth-context';\nimport { apiPost } from '@/lib/api';");
v = v.replace(/const res\s*=\s*await fetch\('https:\/\/inkto\.jointaccount\.org\/api\/verify', \{\s*method: 'POST',\s*headers: \{\s*'Content-Type': 'application\/json',\s*\},\s*body: JSON\.stringify\(\{ email, code: otp \}\),\s*\}\);\s*const data = await res\.json\(\);/, "const data = await apiPost('/verify', { email, code: otp });\n      const res = { ok: true }; // shim");
v = v.replace(/await fetch\('https:\/\/inkto\.jointaccount\.org\/api\/send-otp', \{\s*method: 'POST',\s*headers: \{\s*'Content-Type': 'application\/json',\s*\},\s*body: JSON\.stringify\(\{ email \}\),\s*\}\);/, "await apiPost('/send-otp', { email });");
fs.writeFileSync('frontend/src/app/verify/page.tsx', v);
console.log('Fixed auth pages');

// Auth Context
let a = fs.readFileSync('frontend/src/contexts/auth-context.tsx', 'utf-8');
a = a.replace(/import \{ createContext, useContext, useState, useEffect, ReactNode \} from 'react';/, "import { createContext, useContext, useState, useEffect, ReactNode } from 'react';\nimport { apiGet, apiPost } from '@/lib/api';");

// Remove the interceptor from auth-context.tsx
a = a.replace(/if \(typeof window !== 'undefined' && !\(window as any\)\.__fetch_intercepted__\) \{[\s\S]*?return originalFetch\(input, init\);\s*\};\s*\}/, "");

a = a.replace(/const res = await fetch\(https:\/\/inkto\.jointaccount\.org\/api\/user-status\?t=\$\{Date\.now\(\)\}, \{ credentials: 'include', headers \}\);/, "const data = await apiGet<{email: string; name?: string; credits?: number; subscription?: any}>('/user-status'); const res = {ok: true};");

a = a.replace(/const refreshRes = await fetch\('https:\/\/inkto\.jointaccount\.org\/api\/refresh-session', \{\s*method: 'POST',\s*headers: \{ 'Content-Type': 'application\/json' \},\s*body: JSON\.stringify\(\{ refreshToken \}\)\s*\}\);/, "const refreshData = await apiPost('/refresh-session', { refreshToken }); const refreshRes = {ok: true};");

a = a.replace(/const retryRes = await fetch\(https:\/\/inkto\.jointaccount\.org\/api\/user-status\?t=\$\{Date\.now\(\)\}, \{\s*credentials: 'include',\s*headers: \{ 'Authorization': Bearer \$\{refreshData\.sessionToken\} \}\s*\}\);/, "const retryData = await apiGet<{email: string; name?: string; credits?: number; subscription?: any}>('/user-status'); const retryRes = {ok: true};");

a = a.replace(/const exRes = await fetch\('https:\/\/inkto\.jointaccount\.org\/api\/exchange-code', \{\s*method: 'POST',\s*headers: \{ 'Content-Type': 'application\/json' \},\s*body: JSON\.stringify\(\{ code, token_hash, type \}\)\s*\}\);/, "const exData = await apiPost('/exchange-code', { code, token_hash, type }); const exRes = {ok: true};");

a = a.replace(/await fetch\('https:\/\/inkto\.jointaccount\.org\/api\/logout', \{ method: 'POST', credentials: 'include', headers \}\);/, "await apiPost('/logout', {});");

// fix data/res logic
a = a.replace(/if \(res\.ok\) \{[\s\n]*const data = await res\.json\(\);/g, "if (res.ok) {");
a = a.replace(/if \(refreshRes\.ok\) \{[\s\n]*const refreshData = await refreshRes\.json\(\);/g, "if (refreshRes.ok) {");
a = a.replace(/if \(retryRes\.ok\) \{[\s\n]*const retryData = await retryRes\.json\(\);/g, "if (retryRes.ok) {");
a = a.replace(/if \(exRes\.ok\) \{[\s\n]*const exData = await exRes\.json\(\);/g, "if (exRes.ok) {");

fs.writeFileSync('frontend/src/contexts/auth-context.tsx', a);
console.log('Fixed auth context');
