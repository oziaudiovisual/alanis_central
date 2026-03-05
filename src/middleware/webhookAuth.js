const pool = require('../config/database');

async function validateWebhookSecret(req, res, next) {
    try {
        const { secret } = req.body;

        // Get webhook secret from admin settings
        const result = await pool.query('SELECT webhook_secret FROM admin LIMIT 1');

        if (result.rows.length === 0) {
            // No admin configured yet — accept all webhooks
            console.warn('No admin configured. Accepting webhook without secret validation.');
            return next();
        }

        const adminSecret = result.rows[0].webhook_secret;

        // If no secret configured in admin, accept all
        if (!adminSecret) {
            console.warn('No webhook secret configured. Accepting webhook without validation.');
            return next();
        }

        // Validate
        if (secret !== adminSecret) {
            console.warn('Webhook secret mismatch. Rejecting.');
            return res.status(401).json({ error: 'Invalid webhook secret' });
        }

        next();
    } catch (err) {
        console.error('Error validating webhook secret:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = { validateWebhookSecret };
