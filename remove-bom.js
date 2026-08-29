const fs = require("fs");
const path = require("path");

function removeBOM(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            removeBOM(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.js') || fullPath.endsWith('.css')) {
            const buf = fs.readFileSync(fullPath);
            if (buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF) {
                fs.writeFileSync(fullPath, buf.slice(3));
                console.log("Removed BOM from", fullPath);
            }
        }
    }
}

removeBOM("frontend/src");
