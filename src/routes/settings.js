const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const Admin = require('../models/admin');

// GET /settings
router.get('/', requireAuth, async (req, res) => {
    try {
        const admin = await Admin.findById(req.session.adminId);
        res.render('settings', {
            admin,
            currentPage: 'settings',
            success: req.query.success || null,
            error: req.query.error || null,
        });
    } catch (err) {
        console.error('Settings error:', err);
        res.status(500).render('error', { message: 'Erro ao carregar configurações' });
    }
});

// POST /settings/webhook-secret
router.post('/webhook-secret', requireAuth, async (req, res) => {
    try {
        const { webhook_secret } = req.body;
        await Admin.updateWebhookSecret(req.session.adminId, webhook_secret);
        res.redirect('/settings?success=Webhook secret atualizado com sucesso');
    } catch (err) {
        console.error('Update webhook secret error:', err);
        res.redirect('/settings?error=Erro ao atualizar webhook secret');
    }
});

// POST /settings/password
router.post('/password', requireAuth, async (req, res) => {
    try {
        const { current_password, new_password, confirm_password } = req.body;

        if (new_password !== confirm_password) {
            return res.redirect('/settings?error=As senhas não coincidem');
        }

        if (new_password.length < 6) {
            return res.redirect('/settings?error=A nova senha deve ter pelo menos 6 caracteres');
        }

        const admin = await Admin.findById(req.session.adminId);
        const valid = await Admin.verifyPassword(current_password, admin.password_hash);
        if (!valid) {
            return res.redirect('/settings?error=Senha atual incorreta');
        }

        await Admin.updatePassword(req.session.adminId, new_password);
        res.redirect('/settings?success=Senha atualizada com sucesso');
    } catch (err) {
        console.error('Update password error:', err);
        res.redirect('/settings?error=Erro ao atualizar senha');
    }
});

module.exports = router;
