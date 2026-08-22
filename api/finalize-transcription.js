const { nanoid } = require('nanoid');

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { sessionId, text, totalFilesCount } = req.body || {};
    const id = sessionId || nanoid(21);

    if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Transcript text is required.' });
    }

    try {
        const { checkSupabase } = require('./_utils/supabase');
        const db = checkSupabase();

        const { error } = await db
            .from('documents')
            .upsert([{
                id,
                transcript_text: text,
                source_image_count: Number.isFinite(Number(totalFilesCount)) ? Number(totalFilesCount) : 0
            }], { onConflict: 'id' });

        if (error) throw error;

        return res.json({ success: true, sessionId: id });
    } catch (err) {
        console.error('Failed to finalize transcription:', err);
        return res.status(500).json({ error: 'Transcription completed, but saving the session failed.' });
    }
};
