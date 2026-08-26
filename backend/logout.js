const crypto = require('crypto');

const serializeCookie = (name, val, options = {}) => {
    let str = `${name}=${encodeURIComponent(val)}`;
    if (options.maxAge) str += `; Max-Age=${Math.floor(options.maxAge)}`;
    if (options.path) str += `; Path=${options.path}`;
    if (options.expires) str += `; Expires=${options.expires.toUTCString()}`;
    if (options.httpOnly) str += `; HttpOnly`;
    if (options.secure) str += `; Secure`;
    if (options.sameSite) str += `; SameSite=${options.sameSite}`;
    return str;
};

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    // Clear the auth cookie by setting it to expire immediately
    const host = req.headers.host || '';
    const isSecure = !host.includes('localhost') && !host.includes('127.0.0.1') && !host.includes('192.168.');
    res.setHeader('Set-Cookie', serializeCookie('inkto_auth', '', {
        httpOnly: true,
        secure: isSecure,
        sameSite: 'lax',
        maxAge: 0,
        path: '/'
    }));

    return res.json({ success: true });
};
