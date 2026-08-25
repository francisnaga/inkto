module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) return res.status(500).json({ error: 'Paystack is not configured.' });

    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: 'Email is required' });

    try {
        const response = await fetch('https://api.paystack.co/transaction/initialize', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${secret}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email,
                amount: 500000, // Amount in kobo (e.g., 5,000 NGN)
                callback_url: `${req.headers.origin}/account?upgrade=success`,
                channels: ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer'],
                metadata: {
                    custom_fields: [
                        {
                            display_name: 'Product',
                            variable_name: 'product',
                            value: 'Inkto Pro (30 Days)'
                        }
                    ]
                }
            })
        });

        const data = await response.json();
        if (!data.status) {
            throw new Error(data.message);
        }

        return res.status(200).json({ authorization_url: data.data.authorization_url });
    } catch (err) {
        console.error('Paystack initialize error:', err);
        return res.status(500).json({ error: 'Failed to initialize checkout.' });
    }
};
