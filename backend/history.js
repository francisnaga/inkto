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
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cookie');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    const cookies = parseCookie(req.headers.cookie || '');
    const email = verifyCookie(cookies.inkto_auth);

    if (!email) {
        return res.status(401).json({ error: 'Unauthorized', requireAuth: true });
    }

    try {
        const db = require('./_utils/supabase').checkSupabase();

        const { data, error } = await db
            .from('documents')
            .select('id, transcript_text, source_image_count, created_at, expires_at')
            .eq('email', email)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const validDocs = (data || []).filter(doc => new Date(doc.expires_at) > new Date());

        const history = validDocs.map(doc => {
            const lines = (doc.transcript_text || '').split('\n').filter(Boolean);
            const preview = lines.length > 0 ? lines[0].substring(0, 100) : 'No text';
            return {
                id: doc.id,
                preview: preview + (lines[0] && lines[0].length > 100 ? '...' : ''),
                createdAt: doc.created_at,
                sourceImageCount: doc.source_image_count
            };
        });

        return res.json({ success: true, email, history });
    } catch (err) {
        console.error('History fetch error:', err);
        return res.status(500).json({ error: 'Failed to fetch history.' });
    }
};
