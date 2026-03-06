const crypto = require('crypto');

function safeEqual(a, b) {
    if (!a || !b) return false;
    const bufA = Buffer.from(a, 'utf8');
    const bufB = Buffer.from(b, 'utf8');
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
}

function validateWebhookSecret(req, res, next) {
    const webhookSecret = process.env.WEBHOOK_SECRET;

    if (!webhookSecret) {
        console.error('WEBHOOK_SECRET not configured. Rejecting all webhooks.');
        return res.status(503).json({ error: 'Webhook secret not configured on server' });
    }

    const secret = req.body?.secret || req.headers['x-webhook-secret'];

    if (!secret) {
        console.warn('Webhook request missing secret. Rejecting.');
        return res.status(401).json({ error: 'Missing webhook secret' });
    }

    if (!safeEqual(secret, webhookSecret)) {
        console.warn('Webhook secret mismatch. Rejecting.');
        return res.status(401).json({ error: 'Invalid webhook secret' });
    }

    next();
}

module.exports = { validateWebhookSecret };
