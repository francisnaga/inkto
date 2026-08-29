const fs = require("fs");
let content = fs.readFileSync("frontend/src/app/app/page.tsx", "utf8");

// Add cameraInputRef
content = content.replace(
  "const fileInputRef = useRef<HTMLInputElement>(null);",
  "const fileInputRef = useRef<HTMLInputElement>(null);\n  const cameraInputRef = useRef<HTMLInputElement>(null);"
);

// Add camera input element and update Handwriting button
const oldInput = `<input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*,application/pdf,audio/*" onChange={handleInput} />`;
const newInput = `<input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*,application/pdf,audio/*" onChange={handleInput} />\n          <input type="file" ref={cameraInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleInput} />`;
content = content.replace(oldInput, newInput);

const oldButton = `<button onClick={() => fileInputRef.current?.click()} className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow flex flex-col items-center justify-center gap-3 active:scale-95">\n            <div className="w-12 h-12 rounded-full bg-[#E0E7FF] text-[#4F46E5] flex items-center justify-center">\n              <PenTool size={24} />\n            </div>\n            <span className="font-semibold text-sm text-[#0F172A]">Handwriting</span>`;
const newButton = `<button onClick={() => cameraInputRef.current?.click()} className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow flex flex-col items-center justify-center gap-3 active:scale-95">\n            <div className="w-12 h-12 rounded-full bg-[#E0E7FF] text-[#4F46E5] flex items-center justify-center">\n              <PenTool size={24} />\n            </div>\n            <span className="font-semibold text-sm text-[#0F172A]">Handwriting</span>`;
content = content.replace(oldButton, newButton);

fs.writeFileSync("frontend/src/app/app/page.tsx", content);
console.log("Added dedicated camera input for handwriting");
