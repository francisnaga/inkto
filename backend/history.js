const { getAuthEmail } = require('./_utils/auth');

module.exports = async function handler(req, res) {
    const origin = req.headers.origin || '*';
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cookie, Authorization, X-Inkto-Auth');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    const email = getAuthEmail(req);

    if (!email) {
        return res.status(401).json({ error: 'Unauthorized', requireAuth: true });
    }

    try {
        const db = require('./_utils/supabase').checkSupabase();

        const search = req.query?.search?.trim() || '';

        let query = db
            .from('documents')
            .select('id, title, transcript_text, source_image_count, created_at, expires_at, type, file_url, audio_url')
            .eq('email', email)
            .order('created_at', { ascending: false });

        const { data, error } = await query;

        if (error) throw error;

        let validDocs = (data || []).filter(doc => new Date(doc.expires_at) > new Date());

        if (search) {
            const q = search.toLowerCase();
            validDocs = validDocs.filter(doc =>
                (doc.title || '').toLowerCase().includes(q) ||
                (doc.transcript_text || '').toLowerCase().includes(q)
            );
        }

        const history = validDocs.map(doc => {
            const lines = (doc.transcript_text || '').split('\n').filter(Boolean);
            const autoTitle = lines.length > 0 ? lines[0].substring(0, 80) : (doc.type === 'scan' ? 'Scan' : 'Untitled');
            const preview = lines.length > 0 ? lines[0].substring(0, 100) : '';
            return {
                id: doc.id,
                title: doc.title || autoTitle,
                preview: preview + (lines[0] && lines[0].length > 100 ? '...' : ''),
                createdAt: doc.created_at,
                sourceImageCount: doc.source_image_count || 0,
                type: doc.type || 'transcription',
                fileUrl: doc.file_url || doc.audio_url || null,
                hasText: !!(doc.transcript_text && !doc.transcript_text.startsWith('[Raw voice dictation')),
            };
        });

        return res.json({ success: true, email, history });
    } catch (err) {
        console.error('History fetch error:', err);
        return res.status(500).json({ error: 'Failed to fetch history.' });
    }
};
