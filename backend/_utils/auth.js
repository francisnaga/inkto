const crypto = require('crypto');

const COOKIE_SECRET = process.env.COOKIE_SECRET || process.env.SUPABASE_ANON_KEY || 'inkto-default-secret';

const parseCookie = (str) => {
    if (!str) return {};
    return str.split(';').reduce((res, c) => {
        const idx = c.indexOf('='); if (idx < 0) return res;
        const key = c.slice(0, idx).trim();
        const val = c.slice(idx + 1).trim();
        try { res[key] = decodeURIComponent(val); } catch { res[key] = val; }
        return res;
    }, {});
};

function verifyToken(token) {
    if (!token) return null;
    const lastColon = token.lastIndexOf(':');
    if (lastColon < 0) return null;
    const secondLastColon = token.lastIndexOf(':', lastColon - 1);
    if (secondLastColon < 0) return null;

    const email = token.slice(0, secondLastColon);
    const expiresStr = token.slice(secondLastColon + 1, lastColon);
    const signature = token.slice(lastColon + 1);

    const expires = parseInt(expiresStr, 10);
    if (!email || isNaN(expires) || Date.now() > expires) return null;

    const data = `${email}:${expires}`;
    const expectedSig = crypto.createHmac('sha256', COOKIE_SECRET).update(data).digest('hex');

    if (signature.length !== expectedSig.length) return null;
    try {
        if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) return null;
    } catch { return null; }

    return email;
}

function getAuthEmail(req) {
    // 1. Try cookie
    const cookies = parseCookie(req.headers.cookie || '');
    if (cookies.inkto_auth) {
        const email = verifyToken(cookies.inkto_auth);
        if (email) return email;
    }
    // 2. Try headers
    const authHeader = req.headers['x-inkto-auth'] || req.headers['authorization'];
    if (authHeader) {
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
        const email = verifyToken(token);
        if (email) return email;
    }
    return null;
}

module.exports = {
    verifyToken,
    getAuthEmail,
    parseCookie
};
