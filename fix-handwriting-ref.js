const fs = require("fs");
let content = fs.readFileSync("frontend/src/app/app/page.tsx", "utf8");

content = content.replace(
  /<button onClick=\{\(\) => fileInputRef.current\?.click\(\)\} className="bg-white p-5 rounded-2xl border border-\[#E2E8F0\] shadow-sm hover:shadow-md transition-shadow flex flex-col items-center justify-center gap-3 active:scale-95">\s*<div className="w-12 h-12 rounded-full bg-\[#E0E7FF\] text-\[#4F46E5\] flex items-center justify-center">\s*<PenTool size=\{24\} \/>\s*<\/div>\s*<span className="font-semibold text-sm text-\[#0F172A\]">Handwriting<\/span>/g,
  `<button onClick={() => cameraInputRef.current?.click()} className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow flex flex-col items-center justify-center gap-3 active:scale-95">\n            <div className="w-12 h-12 rounded-full bg-[#E0E7FF] text-[#4F46E5] flex items-center justify-center">\n              <PenTool size={24} />\n            </div>\n            <span className="font-semibold text-sm text-[#0F172A]">Handwriting</span>`
);

fs.writeFileSync("frontend/src/app/app/page.tsx", content);
console.log("Updated Handwriting button to use cameraInputRef");
