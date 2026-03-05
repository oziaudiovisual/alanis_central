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

module.exports = router;
