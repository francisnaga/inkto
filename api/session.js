const { Redis } = require('@upstash/redis');
const { supabase } = require('./utils/supabase');

// ---- Redis fallback for old sessions ----
const redis = process.env.UPSTASH_REDIS_REST_KV_REST_API_URL
    ? new Redis({ url: process.env.UPSTASH_REDIS_REST_KV_REST_API_URL, token: process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN })
    : null;

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'Session ID is required.' });

    try {
        // Try Supabase (Postgres) first — for all new sessions
        const { data: session, error } = await supabase
            .from('documents')
            .select('id, transcript_text, source_image_count, created_at')
            .eq('id', id)
            .single();

        if (session && !error) {
            // Fetch image URLs from storage
            const { data: files } = await supabase.storage.from('inkto-images').list(id);
            const imageUrls = (files || []).map(file =>
                supabase.storage.from('inkto-images').getPublicUrl(`${id}/${file.name}`).data.publicUrl
            );

            return res.json({
                success: true,
                session: {
                    id: session.id,
                    text: session.transcript_text,
                    createdAt: session.created_at,
                    sourceImageCount: session.source_image_count,
                    images: imageUrls
                }
            });
        }

        // Fallback to Redis for old sessions (pre-migration)
        if (redis) {
            const redisData = await redis.get(`session:${id}`);
            if (redisData) {
                const parsed = typeof redisData === 'string' ? JSON.parse(redisData) : redisData;
                return res.json({
                    success: true,
                    session: {
                        id,
                        text: parsed.text || parsed,
                        createdAt: null,
                        sourceImageCount: 0,
                        images: []
                    }
                });
            }
        }

        return res.status(404).json({ error: 'Session not found or has expired.' });
    } catch (err) {
        console.error('Failed to fetch session:', err);
        return res.status(500).json({ error: 'Failed to retrieve session.' });
    }
};
