const fs = require('fs');

// Fix app/page.tsx line 88
let appPage = fs.readFileSync('frontend/src/app/app/page.tsx', 'utf8');
appPage = appPage.replace(/const name = `scan-`\+ new Date\(\)\.toISOString\(\)\.slice\(0, 10\) \+ - \+ pagesCount \+ `p\.pdf`;/, "const name = `scan-${new Date().toISOString().slice(0, 10)}-${pagesCount}p.pdf`;");
fs.writeFileSync('frontend/src/app/app/page.tsx', appPage);

// Fix history/page.tsx rename and delete endpoints
let historyPage = fs.readFileSync('frontend/src/app/history/page.tsx', 'utf8');
historyPage = historyPage.replace(/fetch\(`https:\/\/inkto\.jointaccount\.org\/api\/rename-document',/g, "fetch('https://inkto.jointaccount.org/api/rename-document',");
historyPage = historyPage.replace(/fetch\(`https:\/\/inkto\.jointaccount\.org\/api\/delete-document',/g, "fetch('https://inkto.jointaccount.org/api/delete-document',");
historyPage = historyPage.replace(/fetch\(`https:\/\/inkto\.jointaccount\.org\/api\/history\?limit=100',/g, "fetch('https://inkto.jointaccount.org/api/history?limit=100',");
fs.writeFileSync('frontend/src/app/history/page.tsx', historyPage);

// Fix templates/page.tsx draft and history endpoints
let templatesPage = fs.readFileSync('frontend/src/app/templates/page.tsx', 'utf8');
templatesPage = templatesPage.replace(/fetch\(`https:\/\/inkto\.jointaccount\.org\/api\/draft',/g, "fetch('https://inkto.jointaccount.org/api/draft',");
templatesPage = templatesPage.replace(/fetch\(`https:\/\/inkto\.jointaccount\.org\/api\/history\?limit=15',/g, "fetch('https://inkto.jointaccount.org/api/history?limit=15',");
fs.writeFileSync('frontend/src/app/templates/page.tsx', templatesPage);

// Fix draft/page.tsx draft endpoint
let draftPage = fs.readFileSync('frontend/src/app/draft/page.tsx', 'utf8');
draftPage = draftPage.replace(/fetch\(`https:\/\/inkto\.jointaccount\.org\/api\/draft',/g, "fetch('https://inkto.jointaccount.org/api/draft',");
fs.writeFileSync('frontend/src/app/draft/page.tsx', draftPage);

console.log("Fixed syntax issues");
