const fs = require('fs');

let appPage = fs.readFileSync('frontend/src/app/app/page.tsx', 'utf8');
appPage = appPage.replace(/fetch\(`https:\/\/inkto\.jointaccount\.org\/api\/history\?limit=4',/g, "fetch('https://inkto.jointaccount.org/api/history?limit=4',");
fs.writeFileSync('frontend/src/app/app/page.tsx', appPage);

let historyPage = fs.readFileSync('frontend/src/app/history/page.tsx', 'utf8');
historyPage = historyPage.replace(/fetch\(`https:\/\/inkto\.jointaccount\.org\/api\/history\?limit=100'\)/g, "fetch('https://inkto.jointaccount.org/api/history?limit=100')");
fs.writeFileSync('frontend/src/app/history/page.tsx', historyPage);

let templatesPage = fs.readFileSync('frontend/src/app/templates/page.tsx', 'utf8');
templatesPage = templatesPage.replace(/fetch\(`https:\/\/inkto\.jointaccount\.org\/api\/history\?limit=15'\)/g, "fetch('https://inkto.jointaccount.org/api/history?limit=15')");
fs.writeFileSync('frontend/src/app/templates/page.tsx', templatesPage);

console.log("Fixed mismatched quotes");
