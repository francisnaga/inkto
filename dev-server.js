const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Mock the req.files for multer if needed, or better, let the API routes use multer themselves as they already do.

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

// Route API requests to the functions in /api
app.use('/api', async (req, res) => {
    const apiPath = req.path.replace(/^\//, '').split('?')[0];
    let filePath = path.join(__dirname, 'backend', `${apiPath}.js`);
    
    if (!fs.existsSync(filePath)) {
        filePath = path.join(__dirname, 'backend', apiPath, 'index.js');
    }

    if (fs.existsSync(filePath)) {
        try {
            // Invalidate cache for dev
            delete require.cache[require.resolve(filePath)];
            const handler = require(filePath);
            await handler(req, res);
        } catch (err) {
            console.error(`Error executing ${apiPath}:`, err);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    } else {
        res.status(404).json({ error: 'API route not found' });
    }
});

// Proxy everything else to Next.js dev server
app.use('/', createProxyMiddleware({ target: 'http://localhost:3001', changeOrigin: true }));

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n======================================================`);
    console.log(`ðŸš€ Inkto Local Dev Server running at:`);
    console.log(`- Local:   http://localhost:${PORT}`);
    
    // Print local network IP
    const { networkInterfaces } = require('os');
    const nets = networkInterfaces();
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
            if (net.family === 'IPv4' && !net.internal) {
                console.log(`- Network: http://${net.address}:${PORT}`);
            }
        }
    }
    console.log(`\n(Next.js is running in the background on port 3001)`);
    console.log(`======================================================\n`);
});
