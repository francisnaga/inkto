const fs = require("fs");
let content = fs.readFileSync("frontend/src/components/fetch-interceptor.tsx", "utf8");
content = content.replace(
  "config.credentials = 'include';", 
  "config.credentials = 'include';\n          config.cache = 'no-store';\n          if (config.headers instanceof Headers) { config.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate'); } else if (!Array.isArray(config.headers)) { (config.headers)['Cache-Control'] = 'no-cache, no-store, must-revalidate'; }"
);
fs.writeFileSync("frontend/src/components/fetch-interceptor.tsx", content);
console.log("Updated interceptor caching");
