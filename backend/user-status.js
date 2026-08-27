const { getAuthEmail } = require('./_utils/auth');

module.exports = async function handler(req, res) {
    const origin = req.headers.origin || '*';
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cookie, Authorization, X-Inkto-Auth');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    const email = await getAuthEmail(req);

    if (!email) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const db = require('./_utils/supabase').checkSupabase();
        
        let { data, error } = await db
            .from('users')
            .select('subscription_status, plan_expires_at, is_pro, phone')
            .eq('email', email)
            .single();

        // Fallback if is_pro or phone columns have not been created yet in Supabase
        if (error && (error.code === '42703' || error.message?.includes('does not exist'))) {
            const fallback = await db
                .from('users')
                .select('subscription_status, plan_expires_at')
                .eq('email', email)
                .single();
            data = fallback.data;
            error = fallback.error;
        }

        if (error && error.code !== 'PGRST116') {
            throw error;
        }

        const isPro = data?.is_pro === true || data?.subscription_status === 'active' || data?.subscription_status === 'pro';

        return res.status(200).json({
            email,
            is_pro: isPro,
            subscription_status: isPro ? 'active' : 'free',
            plan_expires_at: data?.plan_expires_at || null,
            phone: data?.phone || null
        });
    } catch (err) {
        console.error('Failed to fetch user status:', err);
        return res.status(500).json({ error: 'Failed to fetch status' });
    }
};
