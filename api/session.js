const { Redis } = require('@upstash/redis');
const { supabase } = require('./utils/supabase');

// ---- Redis Setup for rate limiting ----
const redis = process.env.UPSTASH_REDIS_REST_KV_REST_API_URL 
    ? new Redis({ url: process.env.UPSTASH_REDIS_REST_KV_REST_API_URL, token: process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN })
    : null;

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    // ---- IP Rate Limiting ----
    if (redis) {
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
        if (ip !== 'unknown') {
            const rlKey = `rate_limit:session:${ip}`;
            try {
                const count = await redis.incr(rlKey);
                if (count === 1) await redis.expire(rlKey, 3600);
                if (count > 20) return res.status(429).json({ error: 'Too many requests. Please try again in an hour.' });
            } catch (err) { console.error('Rate limit error:', err); }
        }
    }

    const { id } = req.query;
    if (!id) {
        return res.status(400).json({ error: 'Session ID is required.' });
    }

    try {
        const { data: session, error } = await supabase
            .from('documents')
            .select('id, transcript_text, source_image_count, created_at, email')
            .eq('id', id)
            .single();

        if (error || !session) {
            return res.status(404).json({ error: 'Session not found or has expired.' });
        }
        
        // Also fetch signed URLs or public URLs for the images if we need them
        // The desktop layout will need them.
        const imageUrls = [];
        for (let i = 0; i < session.source_image_count; i++) {
            const { data } = supabase.storage.from('inkto-images').getPublicUrl(`${id}/${i}.jpg`);
            // Assuming they were uploaded as jpg for simplicity in this public url, 
            // but we might need to list files first if they are mixed types.
            // Let's list files in the folder instead to be safe and accurate.
            imageUrls.push(data.publicUrl);
        }
        
        // Let's actually use list to get the real extensions
        const { data: files } = await supabase.storage.from('inkto-images').list(id);
        const actualUrls = files ? files.map(file => {
            return supabase.storage.from('inkto-images').getPublicUrl(`${id}/${file.name}`).data.publicUrl;
        }) : imageUrls;

        return res.json({ 
            success: true, 
            session: {
                id: session.id,
                text: session.transcript_text,
                createdAt: session.created_at,
                sourceImageCount: session.source_image_count,
                images: actualUrls
            } 
        });
    } catch (err) {
        console.error('Failed to fetch session:', err);
        return res.status(500).json({ error: 'Failed to retrieve session.' });
    }
};
