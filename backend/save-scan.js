const multer = require('multer');
const { nanoid } = require('nanoid');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 25 * 1024 * 1024 },
});

function runMiddleware(req, res, fn) {
    return new Promise((resolve, reject) => {
        fn(req, res, (result) => {
            if (result instanceof Error) reject(result);
            else resolve(result);
        });
    });
}

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    // Check Auth
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

    const verifyCookie = (cookieValue) => {
        if (!cookieValue) return null;
        const lastColon = cookieValue.lastIndexOf(':');
        const secondLastColon = cookieValue.lastIndexOf(':', lastColon - 1);
        if (lastColon < 0 || secondLastColon < 0) return null;
        const email = cookieValue.slice(0, secondLastColon);
        const expires = parseInt(cookieValue.slice(secondLastColon + 1, lastColon), 10);
        if (!email || isNaN(expires) || Date.now() > expires) return null;
        return email;
    };

    const cookies = parseCookie(req.headers.cookie || '');
    const userEmail = verifyCookie(cookies.inkto_auth);

    if (!userEmail) {
        return res.status(401).json({ error: 'Please sign in to save scans.', requireAuth: true });
    }

    try {
        await runMiddleware(req, res, upload.single('file'));
    } catch (err) {
        return res.status(400).json({ error: `Upload error: ${err.message}` });
    }

    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file received.' });

    try {
        const { checkSupabase } = require('./_utils/supabase');
        const db = checkSupabase();
        
        const fileId = nanoid(21);
        const filePath = `${fileId}/scan.pdf`;
        
        // Upload to storage
        const { error: uploadErr } = await db.storage.from('inkto-images').upload(filePath, file.buffer, {
            contentType: 'application/pdf',
            upsert: true
        });

        if (uploadErr) throw uploadErr;

        const { data: publicUrlData } = db.storage.from('inkto-images').getPublicUrl(filePath);

        // Save to documents table
        const { error: dbErr } = await db.from('documents').insert([{
            id: fileId,
            email: userEmail,
            type: 'scan',
            title: req.body.title || 'Scanned Document',
            file_url: publicUrlData.publicUrl
        }]);

        if (dbErr) throw dbErr;

        return res.json({ success: true, id: fileId });

    } catch (err) {
        console.error('[Inkto] Save scan failed:', err.message);
        return res.status(500).json({ error: 'Save failed. Please try again.' });
    }
};

module.exports.config = {
    api: { bodyParser: false }
};
