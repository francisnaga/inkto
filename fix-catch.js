const fs = require('fs');
let c = fs.readFileSync('frontend/src/app/account/page.tsx', 'utf-8');
c = c.replace(/\}\s*catch\s*\{\s*alert\('Network error.*?try again.'\);\s*\}/g, "} catch (err: any) { alert(err.message || 'Network error.'); }");
c = c.replace(/\}\s*catch\s*\{\s*alert\('Network error.'\);\s*setUpgrading\(false\);\s*\}/g, "} catch (err: any) { alert(err.message || 'Network error.'); setUpgrading(false); }");
fs.writeFileSync('frontend/src/app/account/page.tsx', c);
