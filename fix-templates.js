const fs = require("fs");
let content = fs.readFileSync("frontend/src/app/templates/page.tsx", "utf8");

content = content.replace(/prompt: `Fill this template[\s\S]*?DETAILS:\\n,/g, "prompt: `Fill this template with the provided details. Output ONLY the filled template text.\\n\\nTEMPLATE:\\n${fittingTemplate.content}\\n\\nDETAILS:\\n${fittingInput}`,");

content = content.replace(/onClick=\{\(\) => setFittingInput\(Extract details from this document transcript: \\n\\n\)\}/g, "onClick={() => setFittingInput(`Extract details from this document transcript: \\n\\n${h.text}`)}");

fs.writeFileSync("frontend/src/app/templates/page.tsx", content);
console.log("Fixed templates logic");
