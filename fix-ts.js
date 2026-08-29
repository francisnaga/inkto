const fs = require("fs");

let pageContent = fs.readFileSync('frontend/src/app/app/page.tsx', 'utf8');
pageContent = pageContent.replace(/onCancel=\{\(\) => setPostScanData\(null\)\}/, 'onCancel={() => setPostScanData(null)}\n          onAddPage={() => {}}\n          onRetake={() => {}}\n          onSaveAsPdf={async () => {}}');
fs.writeFileSync('frontend/src/app/app/page.tsx', pageContent);

let layoutContent = fs.readFileSync('frontend/src/components/app-layout.tsx', 'utf8');
layoutContent = layoutContent.replace(/const \{ user, signOut \} = useAuth\(\);/, 'const { user, logout } = useAuth();');
layoutContent = layoutContent.replace(/onClick=\{\(\) => \{ signOut\(\); router\.push\('\/login'\); \}\}/, "onClick={async () => { await logout(); router.push('/login'); }}");
fs.writeFileSync('frontend/src/components/app-layout.tsx', layoutContent);
console.log("Fixed TS errors");
