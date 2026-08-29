const fs = require("fs");
let content = fs.readFileSync("frontend/src/app/app/page.tsx", "utf8");
content = content.replace(/className="w-10 h-10 rounded-xl flex items-center justify-center mr-4  \+ \(isAudio \? 'bg-orange-50 text-orange-500' : 'bg-red-50 text-red-500'\)'\}>/g, "className={`w-10 h-10 rounded-xl flex items-center justify-center mr-4 ${isAudio ? 'bg-orange-50 text-orange-500' : 'bg-red-50 text-red-500'}`}>");
// Wait, looking at the string, it ends with '})>
content = content.replace(/className="w-10 h-10 rounded-xl flex items-center justify-center mr-4  \+ \(isAudio \? 'bg-orange-50 text-orange-500' : 'bg-red-50 text-red-500'\)\}>/g, "className={`w-10 h-10 rounded-xl flex items-center justify-center mr-4 ${isAudio ? 'bg-orange-50 text-orange-500' : 'bg-red-50 text-red-500'}`}>");
fs.writeFileSync("frontend/src/app/app/page.tsx", content);
console.log("Fixed app/page");
