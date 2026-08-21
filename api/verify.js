const { parse, serialize } = require('cookie');
const crypto = require('crypto');
const { supabase } = require('./utils/supabase');
const { Redis } = require('@upstash/redis');

// ---- Redis Setup for rate limiting ----
const redis = process.env.UPSTASH_REDIS_REST_KV_REST_API_URL 
    ? new Redis({ url: process.env.UPSTASH_REDIS_REST_KV_REST_API_URL, token: process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN })
    : null;

const COOKIE_SECRET = process.env.COOKIE_SECRET || process.env.SUPABASE_ANON_KEY || 'default-secret';

function signCookie(email) {
    const expires = Date.now() + 30 * 24 * 60 * 60 * 1000;
    const data = `${email}:${expires}`;
    const hmac = crypto.createHmac('sha256', COOKIE_SECRET).update(data).digest('hex');
    return `${data}:${hmac}`;
}

module.exports = async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).send('Method not allowed');

    if (redis) {
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
        if (ip !== 'unknown') {
            const rlKey = `rate_limit:verify:${ip}`;
            try {
                const count = await redis.incr(rlKey);
                if (count === 1) await redis.expire(rlKey, 3600);
                if (count > 20) return res.status(429).send('Too many requests. Please try again in an hour.');
            } catch (err) {}
        }
    }

    const { token } = req.query;
    if (!token) return res.status(400).send('Invalid token');

    try {
        const { data: tokenData, error } = await supabase
            .from('auth_tokens')
            .select('email, expires_at, used')
            .eq('token', token)
            .single();

        if (error || !tokenData) {
            return res.status(400).send('Invalid or expired token.');
        }

        if (tokenData.used) {
            return res.status(400).send('Token has already been used.');
        }

        if (new Date(tokenData.expires_at) < new Date()) {
            return res.status(400).send('Token has expired.');
        }

        // Mark used
        await supabase.from('auth_tokens').update({ used: true }).eq('token', token);

        // Set cookie
        const cookieValue = signCookie(tokenData.email);
        res.setHeader('Set-Cookie', serialize('inkto_auth', cookieValue, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 30 * 24 * 60 * 60, // 30 days
            path: '/',
            sameSite: 'lax'
        }));

        res.redirect(302, '/history');
    } catch (err) {
        console.error('Verify error:', err);
        return res.status(500).send('Internal server error');
    }
};
