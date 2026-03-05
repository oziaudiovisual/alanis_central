const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const Transaction = require('../models/transaction');
const Buyer = require('../models/buyer');

// GET / — Dashboard
router.get('/', requireAuth, async (req, res) => {
    try {
        const stats = await Transaction.getStats();
        const activeBuyers = await Buyer.getActiveCount();
        const buyerCounts = await Buyer.getStatusCounts();
        const recentTransactions = await Transaction.getRecent(10);
        const chartData = await Transaction.getRecentByDays(30);

        res.render('dashboard', {
            stats,
            activeBuyers,
            buyerCounts,
            recentTransactions,
            chartData: JSON.stringify(chartData),
            currentPage: 'dashboard',
            admin: req.session.adminEmail,
        });
    } catch (err) {
        console.error('Dashboard error:', err);
        res.status(500).render('error', { message: 'Erro ao carregar dashboard' });
    }
});

module.exports = router;
