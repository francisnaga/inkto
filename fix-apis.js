const fs = require('fs');

const files = [
    'frontend/src/app/app/page.tsx',
    'frontend/src/app/draft/page.tsx',
    'frontend/src/app/history/page.tsx',
    'frontend/src/app/templates/page.tsx',
    'frontend/src/contexts/auth-context.tsx'
];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/fetch\(['"`]\/api\//g, 'fetch(`https://inkto.jointaccount.org/api/');
    // Handle specific cases
    content = content.replace(/fetch\('\/api\/history\?limit=4'\)/g, "fetch('https://inkto.jointaccount.org/api/history?limit=4')");
    content = content.replace(/fetch\('\/api\/history\?limit=100'\)/g, "fetch('https://inkto.jointaccount.org/api/history?limit=100')");
    content = content.replace(/fetch\('\/api\/history\?limit=15'\)/g, "fetch('https://inkto.jointaccount.org/api/history?limit=15')");
    content = content.replace(/fetch\('\/api\/draft'/g, "fetch('https://inkto.jointaccount.org/api/draft'");
    content = content.replace(/fetch\('\/api\/rename-document'/g, "fetch('https://inkto.jointaccount.org/api/rename-document'");
    content = content.replace(/fetch\('\/api\/delete-document'/g, "fetch('https://inkto.jointaccount.org/api/delete-document'");
    content = content.replace(/fetch\(`\/api\/user-status/g, "fetch(`https://inkto.jointaccount.org/api/user-status");
    
    fs.writeFileSync(file, content);
});

console.log("Restored API endpoints");
