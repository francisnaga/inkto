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
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const db = require('./_utils/supabase').checkSupabase();
        
        const { data, error } = await db
            .from('users')
            .select('subscription_status, plan_expires_at')
            .eq('email', email)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw error;
        }

        return res.status(200).json({
            email,
            subscription_status: data?.subscription_status || 'free',
            plan_expires_at: data?.plan_expires_at || null
        });
    } catch (err) {
        console.error('Failed to fetch user status:', err);
        return res.status(500).json({ error: 'Failed to fetch status' });
    }
};
