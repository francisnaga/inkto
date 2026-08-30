const fs = require('fs');
let c = fs.readFileSync('frontend/src/components/output-box.tsx', 'utf-8');
c = c.replace(/const res = await fetch\(endpoint, \{\s*method: 'POST',\s*headers: \{ 'Content-Type': 'application\/json' \},\s*body: JSON\.stringify\(\{ text \}\),\s*\}\);/, "const token = localStorage.getItem('inkto_session');\n        const res = await fetch(https://inkto.jointaccount.org, {\n            method: 'POST',\n            headers: { 'Content-Type': 'application/json', ...(token ? {'Authorization': Bearer } : {}) },\n            body: JSON.stringify({ text }),\n        });");
fs.writeFileSync('frontend/src/components/output-box.tsx', c);
