const fs = require("fs");
let content = fs.readFileSync("frontend/src/components/app-layout.tsx", "utf8");

content = content.replace(/import \{ useAuth \} from '@\/contexts\/auth-context';/, "import { useAuth } from '@/contexts/auth-context';\nimport { InktoWordmark } from '@/components/inkto-logo';");

const oldHeader = `<div className="p-6 flex items-center gap-3">\n          <div className="w-8 h-8 rounded-lg flex items-center justify-center">\n            {/* Custom Logo Icon */}\n            <img src="/icon-192.png" alt="Inkto Logo" className="w-6 h-6 object-contain" />\n          </div>\n          <span className="font-display font-bold text-xl tracking-tight">inkto</span>\n        </div>`;
const newHeader = `<div className="p-6 flex items-center justify-start">\n          <InktoWordmark size={30} />\n        </div>`;

content = content.replace(oldHeader, newHeader);

fs.writeFileSync("frontend/src/components/app-layout.tsx", content);
console.log("Updated layout logo");
