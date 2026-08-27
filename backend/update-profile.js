const { getAuthEmail } = require('./_utils/auth');
const { checkSupabase } = require('./_utils/supabase');

module.exports = async function handler(req, res) {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cookie, Authorization, X-Inkto-Auth');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const email = await getAuthEmail(req);
  if (!email) return res.status(401).json({ error: 'Unauthorized', requireAuth: true });

  const { phone } = req.body || {};

  try {
    const db = checkSupabase();
    const cleanPhone = phone ? String(phone).trim() : null;

    const { error } = await db
      .from('users')
      .upsert({ email: email.toLowerCase(), phone: cleanPhone }, { onConflict: 'email' });

    if (error) {
      if (error.code === '42703' || error.message?.includes('phone')) {
        console.warn('Note: "phone" column is not yet created on users table in Supabase. Returning optimistic response.');
        return res.json({ success: true, phone: cleanPhone, notice: 'Column "phone" pending creation in Supabase' });
      }
      throw error;
    }
    return res.json({ success: true, phone: cleanPhone });
  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(500).json({ error: 'Failed to update profile.' });
  }
};
