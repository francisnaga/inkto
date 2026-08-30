import re

def fix_file(filepath, patterns):
    with open(filepath, 'r', encoding='utf-8') as f: c = f.read()
    for p, r in patterns:
        c = re.sub(p, r, c)
    with open(filepath, 'w', encoding='utf-8') as f: f.write(c)

# 1. account/page.tsx
fix_file('frontend/src/app/account/page.tsx', [
    (r"import \{ useAuth \} from '@/contexts/auth-context';", r"import { useAuth } from '@/contexts/auth-context';\nimport { apiGet, apiPost } from '@/lib/api';"),
    (r"fetch\(https://inkto\.jointaccount\.org/api/user-status\?t=\$\{Date\.now\(\)\}, \{[^\}]+\}\)\s*\.then\(r => r\.json\(\)\)", r"apiGet('/user-status').then(data => data)"),
    (r"const res = await fetch\('https://inkto\.jointaccount\.org/api/update-profile', \{\s*method: 'POST', headers: \{ 'Content-Type': 'application/json' \}, body: JSON\.stringify\(\{ phone \}\),\s*\}\);\s*if \(res\.ok\) \{", r"const data = await apiPost('/update-profile', { phone });\n      if (data) {"),
    (r"const res = await fetch\('https://inkto\.jointaccount\.org/api/update-profile', \{\s*method: 'POST', headers: \{ 'Content-Type': 'application/json' \}, body: JSON\.stringify\(\{ name \}\),\s*\}\);\s*if \(res\.ok\) \{", r"const data = await apiPost('/update-profile', { name });\n        if (data) {"),
    (r"const res  = await fetch\('https://inkto\.jointaccount\.org/api/checkout', \{\s*method: 'POST', headers: \{ 'Content-Type': 'application/json' \}, body: JSON\.stringify\(\{ email: user!\.email \}\),\s*\}\);\s*const data = await res\.json\(\);", r"const data = await apiPost<{url: string}>('/checkout', { email: user!.email });")
])
print('fixed account')

# 2. draft/page.tsx
fix_file('frontend/src/app/draft/page.tsx', [
    (r"import \{ useAuth \} from '@/contexts/auth-context';", r"import { useAuth } from '@/contexts/auth-context';\nimport { apiGet, apiPost } from '@/lib/api';"),
    (r"const res = await fetch\('https://inkto\.jointaccount\.org/api/draft', \{\s*method: 'POST',\s*headers: \{\s*'Content-Type': 'application/json',\s*\}\s*,\s*body: JSON\.stringify\(\{ title, text: content \}\),\s*\}\);\s*if \(res\.ok\) \{\s*const data = await res\.json\(\);", r"const data = await apiPost('/draft', { title, text: content });\n      if (data) {")
])
print('fixed draft')

# 3. templates/page.tsx
fix_file('frontend/src/app/templates/page.tsx', [
    (r"import \{ useAuth \} from '@/contexts/auth-context';", r"import { useAuth } from '@/contexts/auth-context';\nimport { apiGet, apiPost } from '@/lib/api';"),
    (r"const res = await fetch\(endpoint, \{\s*method: 'POST',\s*headers: \{\s*'Content-Type': 'application/json',\s*\}\s*,\s*body: JSON\.stringify\(payload\),\s*\}\);\s*if \(!res\.ok\) throw new Error\('Failed to generate template'\);\s*const data = await res\.json\(\);", r"const data = await apiPost(endpoint.replace('https://inkto.jointaccount.org/api', ''), payload);"),
    (r"const res = await fetch\('https://inkto\.jointaccount\.org/api/history\?limit=15'\);\s*if \(res\.ok\) \{\s*const data = await res\.json\(\);", r"const data = await apiGet('/history?limit=15');\n        if (data) {"),
    (r"const res = await fetch\('https://inkto\.jointaccount\.org/api/draft', \{\s*method: 'POST',\s*headers: \{\s*'Content-Type': 'application/json',\s*\}\s*,\s*body: JSON\.stringify\(\{ title: docTitle, text: data\.text \}\),\s*\}\);\s*if \(res\.ok\) \{\s*const draftData = await res\.json\(\);", r"const draftData = await apiPost('/draft', { title: docTitle, text: data.text });\n      if (draftData) {")
])
print('fixed templates')

# 4. components/output-box.tsx
fix_file('frontend/src/components/output-box.tsx', [
    (r"import \{ useState, useEffect, useRef \} from 'react';", r"import { useState, useEffect, useRef } from 'react';\nimport { apiPost } from '@/lib/api';"),
    (r"const res = await fetch\(endpoint, \{\s*method: 'POST',\s*headers: \{\s*'Content-Type': 'application/json',\s*\}\s*,\s*body: JSON\.stringify\(payload\),\s*\}\);\s*if \(!res\.ok\) throw new Error\('Failed'\);\s*const data = await res\.json\(\);", r"const data = await apiPost(endpoint.replace('https://inkto.jointaccount.org/api', ''), payload);")
])
print('fixed output-box')
