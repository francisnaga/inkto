const crypto = require('crypto');

const parseCookie = (str) => {
    if (!str) return {};
    return str.split(';').reduce((res, c) => {
        const idx = c.indexOf('=');
        if (idx < 0) return res;
        const key = c.slice(0, idx).trim();
        const val = c.slice(idx + 1).trim();
        if (key) {
            try { res[key] = decodeURIComponent(val); } catch { res[key] = val; }
        }
        return res;
    }, {});
};

const COOKIE_SECRET = process.env.COOKIE_SECRET || process.env.SUPABASE_ANON_KEY || 'inkto-default-secret';

function verifyCookie(cookieValue) {
    if (!cookieValue) return null;
    const lastColon = cookieValue.lastIndexOf(':');
    if (lastColon < 0) return null;
    const secondLastColon = cookieValue.lastIndexOf(':', lastColon - 1);
    if (secondLastColon < 0) return null;

    const email = cookieValue.slice(0, secondLastColon);
    const expiresStr = cookieValue.slice(secondLastColon + 1, lastColon);
    const signature = cookieValue.slice(lastColon + 1);

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

module.exports = async function handler(req, res) {
    const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cookie, Authorization, X-Inkto-Auth');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const cookies = parseCookie(req.headers.cookie || '');
    const email = await require('./_utils/auth').getAuthEmail(req);

    if (!email) {
        return res.status(401).json({ error: 'Unauthorized', requireAuth: true });
    }

    const { sessionId } = req.body || {};
    if (!sessionId) {
        return res.status(400).json({ error: 'Session ID is required.' });
    }

    try {
        const db = require('./_utils/supabase').checkSupabase();

        const { error } = await db
            .from('documents')
            .delete()
            .eq('id', sessionId)
            .eq('email', email); // Ensure they only delete their own document

        if (error) throw error;

        return res.json({ success: true });
    } catch (err) {
        console.error('Delete session error:', err);
        return res.status(500).json({ error: 'Failed to delete session.' });
    }
};
