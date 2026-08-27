const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://leqvvgdwwllroqyknsvq.supabase.co';

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

async function verifyToken(token) {
    if (!token) return null;

    if (process.env.INKTO_TESTING === 'true' && token.startsWith('test-token:')) {
        return token.split(':')[1];
    }

    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    if (!supabaseKey) return null;

    try {
        const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) {
            return null;
        }
        return user.email;
    } catch (err) {
        console.error('verifyToken error:', err);
        return null;
    }
}

async function getAuthEmail(req) {
    // 1. Try headers first (modern built-in Supabase session flow)
    const authHeader = req.headers['authorization'] || req.headers['x-inkto-auth'];
    if (authHeader) {
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
        const email = await verifyToken(token);
        if (email) return email;
    }

    // 2. Try cookie (fallback/legacy)
    const cookies = parseCookie(req.headers.cookie || '');
    if (cookies.inkto_auth) {
        const email = await verifyToken(cookies.inkto_auth);
        if (email) return email;
    }

    return null;
}

module.exports = {
    verifyToken,
    getAuthEmail,
    parseCookie
};
