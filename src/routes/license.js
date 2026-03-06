const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const License = require('../models/license');

function safeEqual(a, b) {
    if (!a || !b) return false;
    const bufA = Buffer.from(a, 'utf8');
    const bufB = Buffer.from(b, 'utf8');
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
}

// POST /license/validate — Public endpoint
router.post('/validate', async (req, res) => {
    try {
        const { key, instanceId } = req.body;
        if (!key) {
            return res.status(400).json({ valid: false, reason: 'missing_key' });
        }

        const result = await License.validate(key, instanceId || null);
        return res.json(result);
    } catch (err) {
        console.error('License validate error:', err);
        return res.status(500).json({ valid: false, reason: 'server_error' });
    }
});

// POST /license/revoke — Protected by webhook secret
router.post('/revoke', async (req, res) => {
    try {
        const { key } = req.body;
        const secret = req.body.secret || req.headers['x-webhook-secret'];

        if (!key) {
            return res.status(400).json({ success: false, reason: 'missing_key' });
        }

        // Verify webhook secret via env var with timing-safe comparison
        const webhookSecret = process.env.WEBHOOK_SECRET;
        if (!webhookSecret || !safeEqual(secret, webhookSecret)) {
            return res.status(401).json({ success: false, reason: 'unauthorized' });
        }

        const revoked = await License.revokeByKey(key);
        if (!revoked) {
            return res.status(404).json({ success: false, reason: 'not_found' });
        }
        return res.json({ success: true, license: revoked });
    } catch (err) {
        console.error('License revoke error:', err);
        return res.status(500).json({ success: false, reason: 'server_error' });
    }
});

// GET /license/recover — Public recovery page
router.get('/recover', (req, res) => {
    res.render('recover', {});
});

// POST /license/recover — Lookup by email + CPF
router.post('/recover', async (req, res) => {
    try {
        const { email, doc } = req.body;
        if (!email || !doc) {
            return res.render('recover', { error: 'Preencha todos os campos.', email, doc });
        }

        const licenses = await License.findByEmailAndDoc(email, doc);
        res.render('recover', { licenses, email, doc });
    } catch (err) {
        console.error('License recover error:', err);
        res.render('recover', { error: 'Erro interno. Tente novamente.' });
    }
});

module.exports = router;
