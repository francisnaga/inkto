const crypto = require('crypto');

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-paystack-signature');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) return res.status(500).json({ error: 'Paystack is not configured.' });

    // Validate signature
    const hash = crypto.createHmac('sha512', secret)
        .update(JSON.stringify(req.body))
        .digest('hex');

    if (hash !== req.headers['x-paystack-signature']) {
        return res.status(401).json({ error: 'Invalid signature' });
    }

    const event = req.body;

    if (event.event === 'charge.success') {
        const email = event.data.customer.email;
        const db = require('./_utils/supabase').checkSupabase();
        
        // 30-day Pro plan from time of payment
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

        // Update user status
        // Ensure user exists first, if not create one via upsert or separate call
        const { error } = await db.from('users').upsert({
            email: email.toLowerCase(),
            subscription_status: 'active',
            plan_expires_at: expiresAt
        }, { onConflict: 'email' });

        if (error) {
            console.error('Failed to update subscription:', error);
            return res.status(500).json({ error: 'Database update failed' });
        }

        console.log(`Successfully upgraded user: ${email}`);
    }

    // Acknowledge receipt to Paystack
    return res.status(200).json({ received: true });
};
