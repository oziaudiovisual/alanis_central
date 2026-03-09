const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const License = require('../models/license');

router.get('/', requireAuth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const status = req.query.status || 'all';
        const search = req.query.search || '';

        const { licenses, total, totalPages } = await License.findAll({ page, limit: 25, status, search });
        const counts = await License.countByStatus();

        res.render('licenses', {
            currentPage: 'licenses',
            admin: req.session.admin,
            licenses,
            counts,
            pagination: { page, totalPages, total },
            filters: { status, search },
        });
    } catch (err) {
        console.error('Licenses page error:', err);
        res.status(500).render('error', { message: 'Erro ao carregar licenças' });
    }
});

router.post('/:id/reactivate', requireAuth, async (req, res) => {
    try {
        const hours = parseInt(req.body.hours) || null;
        const license = await License.reactivate(req.params.id, hours);
        if (!license) {
            return res.redirect('/licenses?error=Licença não encontrada');
        }
        const msg = hours
            ? `Licença reativada por ${hours}h`
            : 'Licença reativada permanentemente';
        console.log(`Admin reactivated license: ${license.license_key} (${msg})`);
        res.redirect(`/licenses?success=${encodeURIComponent(msg)}`);
    } catch (err) {
        console.error('Reactivate error:', err);
        res.redirect('/licenses?error=Erro ao reativar licença');
    }
});

router.post('/:id/reset', requireAuth, async (req, res) => {
    try {
        const license = await License.resetInstances(req.params.id);
        if (!license) {
            return res.redirect('/licenses?error=Licença não encontrada');
        }
        console.log(`Admin reset license instances: ${license.license_key}`);
        res.redirect('/licenses?success=Instâncias da licença resetadas com sucesso');
    } catch (err) {
        console.error('Reset instances error:', err);
        res.redirect('/licenses?error=Erro ao resetar instâncias');
    }
});

module.exports = router;
