const pool = require('../config/database');
const bcrypt = require('bcryptjs');

const Admin = {
    async findByEmail(email) {
        const result = await pool.query('SELECT * FROM admin WHERE email = $1', [email]);
        return result.rows[0] || null;
    },

    async findById(id) {
        const result = await pool.query('SELECT * FROM admin WHERE id = $1', [id]);
        return result.rows[0] || null;
    },

    async count() {
        const result = await pool.query('SELECT COUNT(*) FROM admin');
        return parseInt(result.rows[0].count);
    },

    async create(email, password) {
        const hash = await bcrypt.hash(password, 12);
        const result = await pool.query(
            'INSERT INTO admin (email, password_hash) VALUES ($1, $2) RETURNING *',
            [email, hash]
        );
        return result.rows[0];
    },

    async verifyPassword(plaintext, hash) {
        return bcrypt.compare(plaintext, hash);
    },

    async updatePassword(id, newPassword) {
        const hash = await bcrypt.hash(newPassword, 12);
        await pool.query(
            'UPDATE admin SET password_hash = $1, updated_at = NOW() WHERE id = $2',
            [hash, id]
        );
    },

    async updateWebhookSecret(id, secret) {
        await pool.query(
            'UPDATE admin SET webhook_secret = $1, updated_at = NOW() WHERE id = $2',
            [secret, id]
        );
    },

    async getWebhookSecret() {
        const result = await pool.query('SELECT webhook_secret FROM admin LIMIT 1');
        return result.rows[0]?.webhook_secret || null;
    }
};

module.exports = Admin;
