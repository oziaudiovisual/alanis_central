const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const Buyer = require('../models/buyer');

// GET /buyers
router.get('/', requireAuth, async (req, res) => {
    try {
        const { page = 1, status, search } = req.query;
        const result = await Buyer.findAll({
            page: parseInt(page),
            limit: 20,
            status: status || 'all',
            search,
        });

        res.render('buyers', {
            ...result,
            filters: { status: status || 'all', search: search || '' },
            currentPage: 'buyers',
            admin: req.session.adminEmail,
        });
    } catch (err) {
        console.error('Buyers error:', err);
        res.status(500).render('error', { message: 'Erro ao carregar compradores' });
    }
});

// GET /buyers/export
router.get('/export', requireAuth, async (req, res) => {
    try {
        const { status, search } = req.query;
        const buyers = await Buyer.exportAll({ status, search });

        // CSV header
        const header = 'Nome,Email,Telefone,Documento,Status,Primeira Compra,Último Evento,Total Gasto\n';
        const rows = buyers.map(b =>
            `"${b.name || ''}","${b.email}","${b.phone || ''}","${b.doc || ''}","${b.status}","${b.first_purchase_at || ''}","${b.last_event_at || ''}","${b.total_spent || 0}"`
        ).join('\n');

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="compradores.csv"');
        res.send('\uFEFF' + header + rows); // BOM for Excel UTF-8
    } catch (err) {
        console.error('Export error:', err);
        res.status(500).json({ error: 'Erro ao exportar' });
    }
});

module.exports = router;
