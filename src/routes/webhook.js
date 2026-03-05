const express = require('express');
const router = express.Router();
const { validateWebhookSecret } = require('../middleware/webhookAuth');
const { processWebhook } = require('../services/webhookProcessor');

// POST /webhook/cakto
router.post('/cakto', validateWebhookSecret, async (req, res) => {
    try {
        const { event, data } = req.body;

        if (!event || !data) {
            return res.status(400).json({ error: 'Missing event or data in payload' });
        }

        const result = await processWebhook(event, data, req.body);

        if (!result.success) {
            return res.status(400).json({ error: result.reason });
        }

        return res.status(200).json({ ok: true, transactionId: result.transactionId });
    } catch (err) {
        console.error('Webhook processing error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// Health check
router.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = router;
