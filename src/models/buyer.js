const pool = require('../config/database');

const Buyer = {
    async upsert(data) {
        // Insert or update buyer based on email
        const result = await pool.query(`
      INSERT INTO buyers (email, name, phone, doc, status, first_purchase_at, last_event_at, total_spent)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), COALESCE($6::numeric, 0))
      ON CONFLICT (email) DO UPDATE SET
        name = COALESCE($2, buyers.name),
        phone = COALESCE($3, buyers.phone),
        doc = COALESCE($4, buyers.doc),
        status = $5,
        last_event_at = NOW(),
        total_spent = buyers.total_spent + COALESCE($6::numeric, 0),
        updated_at = NOW()
      RETURNING *
    `, [data.email, data.name, data.phone, data.doc, data.status, data.amount]);
        return result.rows[0];
    },

    async updateStatus(email, status) {
        const result = await pool.query(
            `UPDATE buyers SET status = $1, last_event_at = NOW(), updated_at = NOW() WHERE email = $2 RETURNING *`,
            [status, email]
        );
        return result.rows[0] || null;
    },

    async findAll({ page = 1, limit = 20, status, search } = {}) {
        const offset = (page - 1) * limit;
        let where = [];
        let params = [];
        let paramIdx = 1;

        if (status && status !== 'all') {
            where.push(`status = $${paramIdx++}`);
            params.push(status);
        }
        if (search) {
            where.push(`(name ILIKE $${paramIdx} OR email ILIKE $${paramIdx})`);
            params.push(`%${search}%`);
            paramIdx++;
        }

        const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

        const countResult = await pool.query(
            `SELECT COUNT(*) FROM buyers ${whereClause}`,
            params
        );
        const total = parseInt(countResult.rows[0].count);

        const result = await pool.query(
            `SELECT * FROM buyers ${whereClause} ORDER BY updated_at DESC LIMIT $${paramIdx++} OFFSET $${paramIdx}`,
            [...params, limit, offset]
        );

        return {
            buyers: result.rows,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        };
    },

    async findByEmail(email) {
        const result = await pool.query('SELECT * FROM buyers WHERE email = $1', [email]);
        return result.rows[0] || null;
    },

    async getActiveCount() {
        const result = await pool.query("SELECT COUNT(*) FROM buyers WHERE status = 'active'");
        return parseInt(result.rows[0].count);
    },

    async getStatusCounts() {
        const result = await pool.query(`
      SELECT status, COUNT(*) as count
      FROM buyers
      GROUP BY status
    `);
        const counts = { active: 0, refunded: 0, chargeback: 0 };
        result.rows.forEach(r => { counts[r.status] = parseInt(r.count); });
        return counts;
    },

    async exportAll({ status, search } = {}) {
        let where = [];
        let params = [];
        let paramIdx = 1;

        if (status && status !== 'all') {
            where.push(`status = $${paramIdx++}`);
            params.push(status);
        }
        if (search) {
            where.push(`(name ILIKE $${paramIdx} OR email ILIKE $${paramIdx})`);
            params.push(`%${search}%`);
            paramIdx++;
        }

        const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
        const result = await pool.query(
            `SELECT name, email, phone, doc, status, first_purchase_at, last_event_at, total_spent
       FROM buyers ${whereClause} ORDER BY name ASC`,
            params
        );
        return result.rows;
    }
};

module.exports = Buyer;
