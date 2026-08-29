const fs = require("fs");
let content = fs.readFileSync("frontend/src/components/app-layout.tsx", "utf8");
content = content.replace(/<div className="flex justify-between items-center h-14 px-4">/, '<div className="flex justify-around items-center h-14">');
fs.writeFileSync("frontend/src/components/app-layout.tsx", content);
console.log("Updated to justify-around");
