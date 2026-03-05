const express = require('express');
const router = express.Router();
const License = require('../models/license');

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
        const { key, secret } = req.body;
        if (!key) {
            return res.status(400).json({ success: false, reason: 'missing_key' });
        }

        // Verify webhook secret
        const Admin = require('../models/admin');
        const admin = await Admin.findByEmail(process.env.ADMIN_EMAIL || 'admin@alanis.com');
        if (!admin || !admin.webhook_secret || secret !== admin.webhook_secret) {
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

module.exports = router;
