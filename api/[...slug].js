module.exports = async function handler(req, res) {
    const slug = req.query.slug || [];
    const action = slug[0] || req.url.split('?')[0].split('/').pop();

    // Parse JSON manually if it's application/json, since bodyParser is globally disabled
    if (req.method !== 'GET' && req.headers['content-type']?.includes('application/json')) {
        req.body = await new Promise((resolve) => {
            let body = '';
            req.on('data', chunk => { body += chunk.toString(); });
            req.on('end', () => {
                try { resolve(JSON.parse(body)); } catch(e) { resolve({}); }
            });
        });
    }

    switch (action) {
        case 'aggregate-rating': return require('../backend/aggregate-rating.js')(req, res);
        case 'checkout': return require('../backend/checkout.js')(req, res);
        case 'delete-document': return require('../backend/delete-document.js')(req, res);
        case 'delete-session': return require('../backend/delete-session.js')(req, res);
        case 'download-docx': return require('../backend/download-docx.js')(req, res);
        case 'download-pdf': return require('../backend/download-pdf.js')(req, res);
        case 'draft': return require('../backend/draft.js')(req, res);
        case 'finalize-transcription': return require('../backend/finalize-transcription.js')(req, res);
        case 'history': return require('../backend/history.js')(req, res);
        case 'logout': return require('../backend/logout.js')(req, res);
        case 'paystack-webhook': return require('../backend/paystack-webhook.js')(req, res);
        case 'rate': return require('../backend/rate.js')(req, res);
        case 'rename-document': return require('../backend/rename-document.js')(req, res);
        case 'request-history-link': return require('../backend/request-history-link.js')(req, res);
        case 'save-history': return require('../backend/save-history.js')(req, res);
        case 'save-scan': return require('../backend/save-scan.js')(req, res);
        case 'send-email': return require('../backend/send-email.js')(req, res);
        case 'send-otp': return require('../backend/send-otp.js')(req, res);
        case 'session': return require('../backend/session.js')(req, res);
        case 'transcribe': return require('../backend/transcribe.js')(req, res);
        case 'user-status': return require('../backend/user-status.js')(req, res);
        case 'user-templates': return require('../backend/user-templates.js')(req, res);
        case 'verify': return require('../backend/verify.js')(req, res);
        default:
            return res.status(404).json({ error: 'Endpoint not found: ' + action });
    }
};

module.exports.config = {
    api: {
        bodyParser: false
    }
};