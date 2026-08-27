const crypto = require('crypto');
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
  res.setHeader('Access-Control-Allow-Methods', 'PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cookie, Authorization, X-Inkto-Auth');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' });

  const email = await require('./_utils/auth').getAuthEmail(req);
  if (!email) return res.status(401).json({ error: 'Unauthorized' });

  const { id, title } = req.body || {};
  if (!id || !title?.trim()) return res.status(400).json({ error: 'id and title required' });

  try {
    const db = require('./_utils/supabase').checkSupabase();
    const { error } = await db.from('documents')
      .update({ title: title.trim().slice(0, 200) })
      .eq('id', id)
      .eq('email', email);
    if (error) throw error;
    return res.json({ success: true });
  } catch (e) {
    console.error('rename-document error:', e);
    return res.status(500).json({ error: 'Rename failed' });
  }
};
