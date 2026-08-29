const fs = require("fs");
let content = fs.readFileSync("frontend/src/components/fetch-interceptor.tsx", "utf8");
content = content.replace("config.headers = config.headers || {};", "config.headers = config.headers || {};\n          config.credentials = 'include';");
fs.writeFileSync("frontend/src/components/fetch-interceptor.tsx", content);
console.log("Added credentials: include");
