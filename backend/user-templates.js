const crypto = require('crypto');
const { nanoid } = require('nanoid');

const COOKIE_SECRET = process.env.COOKIE_SECRET || process.env.SUPABASE_ANON_KEY || 'inkto-default-secret';

function parseCookie(str) {
  return (str || '').split(';').reduce((r, c) => {
    const i = c.indexOf('='); if (i < 0) return r;
    const k = c.slice(0, i).trim(), v = c.slice(i + 1).trim();
    if (k) try { r[k] = decodeURIComponent(v); } catch { r[k] = v; }
    return r;
  }, {});
}

function verifyCookie(v) {
  if (!v) return null;
  const l = v.lastIndexOf(':'), l2 = v.lastIndexOf(':', l - 1);
  if (l < 0 || l2 < 0) return null;
  const email = v.slice(0, l2), exp = parseInt(v.slice(l2 + 1, l), 10), sig = v.slice(l + 1);
  if (!email || isNaN(exp) || Date.now() > exp) return null;
  const expected = crypto.createHmac('sha256', COOKIE_SECRET).update(`${email}:${exp}`).digest('hex');
  try { return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected)) ? email : null; } catch { return null; }
}

module.exports = async function handler(req, res) {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cookie, Authorization, X-Inkto-Auth');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const email = await require('./_utils/auth').getAuthEmail(req);
  if (!email) return res.status(401).json({ error: 'Unauthorized', requireAuth: true });

  try {
    const db = require('./_utils/supabase').checkSupabase();

    if (req.method === 'GET') {
      const { data, error } = await db
        .from('user_templates')
        .select('id, title, content, created_at')
        .eq('email', email.toLowerCase())
        .order('created_at', { ascending: false });

      if (error) throw error;
      return res.json({ success: true, templates: data || [] });
    }

    if (req.method === 'POST') {
      const { title, content } = req.body || {};
      if (!title?.trim() || !content?.trim()) {
        return res.status(400).json({ error: 'Title and content are required.' });
      }

      const id = nanoid(21);
      const { error } = await db.from('user_templates').insert([{
        id,
        email: email.toLowerCase(),
        title: title.trim().slice(0, 200),
        content: content.trim()
      }]);

      if (error) throw error;
      return res.json({ success: true, id });
    }

    if (req.method === 'DELETE') {
      const { id } = req.body || req.query || {};
      if (!id) return res.status(400).json({ error: 'ID is required.' });

      const { error } = await db
        .from('user_templates')
        .delete()
        .eq('id', id)
        .eq('email', email.toLowerCase());

      if (error) throw error;
      return res.json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('User templates handler error:', err);
    return res.status(500).json({ error: err.message || 'Operation failed.' });
  }
};
