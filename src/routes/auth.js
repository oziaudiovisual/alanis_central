const express = require('express');
const router = express.Router();
const Admin = require('../models/admin');

// GET /auth/login
router.get('/login', (req, res) => {
    if (req.session && req.session.adminId) {
        return res.redirect('/');
    }
    res.render('login', { error: null });
});

// POST /auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const admin = await Admin.findByEmail(email);
        if (!admin) {
            return res.render('login', { error: 'Credenciais inválidas' });
        }

        const valid = await Admin.verifyPassword(password, admin.password_hash);
        if (!valid) {
            return res.render('login', { error: 'Credenciais inválidas' });
        }

        req.session.adminId = admin.id;
        req.session.adminEmail = admin.email;
        res.redirect('/');
    } catch (err) {
        console.error('Login error:', err);
        res.render('login', { error: 'Erro interno. Tente novamente.' });
    }
});

// GET /auth/logout
router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/auth/login');
    });
});

module.exports = router;
