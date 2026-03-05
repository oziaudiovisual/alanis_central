const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const Transaction = require('../models/transaction');

// GET /transactions
router.get('/', requireAuth, async (req, res) => {
    try {
        const { page = 1, eventType, search } = req.query;
        const result = await Transaction.findAll({
            page: parseInt(page),
            limit: 20,
            eventType,
            search,
        });

        res.render('transactions', {
            ...result,
            filters: { eventType: eventType || '', search: search || '' },
            currentPage: 'transactions',
            admin: req.session.adminEmail,
        });
    } catch (err) {
        console.error('Transactions error:', err);
        res.status(500).render('error', { message: 'Erro ao carregar transações' });
    }
});

// GET /transactions/:id (JSON — for payload modal)
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const tx = await Transaction.findById(req.params.id);
        if (!tx) return res.status(404).json({ error: 'Transação não encontrada' });
        res.json(tx);
    } catch (err) {
        console.error('Transaction detail error:', err);
        res.status(500).json({ error: 'Erro interno' });
    }
});

module.exports = router;
