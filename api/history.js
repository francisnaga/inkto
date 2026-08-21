const parseCookie = (str) => {
    if (!str) return {};
    return str.split(';').reduce((res, c) => {
        const [key, val] = c.split('=').map(i => i.trim());
        if (key && val) {
            try { res[key] = decodeURIComponent(val); } catch(e) { res[key] = val; }
        }
        return res;
    }, {});
};
const crypto = require('crypto');
const { supabase } = require('./utils/supabase');

const COOKIE_SECRET = process.env.COOKIE_SECRET || process.env.SUPABASE_ANON_KEY || 'default-secret';

function verifyCookie(cookieValue) {
    if (!cookieValue) return null;
    const parts = cookieValue.split(':');
    if (parts.length !== 3) return null;
    const [email, expiresStr, signature] = parts;
    const expires = parseInt(expiresStr, 10);
    if (Date.now() > expires) return null;

    const data = `${email}:${expires}`;
    const expectedSig = crypto.createHmac('sha256', COOKIE_SECRET).update(data).digest('hex');
    
    // Constant-time comparison
    if (signature.length !== expectedSig.length) return null;
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) return null;

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
        const db = require('./utils/supabase').checkSupabase();
        
        const { data, error } = await db
            .from('documents')
            .select('id, transcript_text, source_image_count, created_at, expires_at')
            .eq('email', email)
            .order('created_at', { ascending: false });

        if (error) {
            throw error;
        }

        // Only return documents that haven't expired
        const validDocs = data.filter(doc => new Date(doc.expires_at) > new Date());

        // Trim the transcript text to create a preview
        const history = validDocs.map(doc => {
            const lines = (doc.transcript_text || '').split('\n').filter(Boolean);
            const preview = lines.length > 0 ? lines[0].substring(0, 80) : 'No text';
            return {
                id: doc.id,
                preview: preview + (lines[0] && lines[0].length > 80 ? '...' : ''),
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
