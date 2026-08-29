const fs = require("fs");
let content = fs.readFileSync("frontend/src/app/history/page.tsx", "utf8");
content = content.replace(/divide-\[\#E2E8F0\][\r\n]+overflow-hidden/g, "divide-[#E2E8F0] overflow-hidden");
fs.writeFileSync("frontend/src/app/history/page.tsx", content);
console.log("Fixed multiline");
