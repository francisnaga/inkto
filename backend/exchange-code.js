const { checkSupabase } = require('./_utils/supabase');

module.exports = async function handler(req, res) {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cookie, Authorization, X-Inkto-Auth');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { code, token_hash, type } = req.body || {};

  try {
    const db = checkSupabase();

    if (code) {
      const { data, error } = await db.auth.exchangeCodeForSession(code);
      if (error) throw error;
      return res.json({
        success: true,
        email: data.user.email,
        sessionToken: data.session.access_token,
        refreshToken: data.session.refresh_token
      });
    }

    if (token_hash) {
      const { data, error } = await db.auth.verifyOtp({
        token_hash,
        type: type || 'email'
      });
      if (error) throw error;
      return res.json({
        success: true,
        email: data.user.email,
        sessionToken: data.session.access_token,
        refreshToken: data.session.refresh_token
      });
    }

    return res.status(400).json({ error: 'Missing code or token_hash' });
  } catch (err) {
    console.error('Code exchange error:', err.message);
    return res.status(400).json({ error: err.message });
  }
};
