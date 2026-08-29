const fs = require("fs");
let content = fs.readFileSync("frontend/src/components/fetch-interceptor.tsx", "utf8");
content = content.replace(
  "let [resource, config] = args;", 
  "let [resource, config] = args;\n        if (typeof resource === 'string' && resource.includes('inkto.jointaccount.org/api/')) {\n          const url = new URL(resource);\n          url.searchParams.set('_t', Date.now().toString());\n          resource = url.toString();\n        }"
);
fs.writeFileSync("frontend/src/components/fetch-interceptor.tsx", content);
console.log("Added cache buster to URL");
