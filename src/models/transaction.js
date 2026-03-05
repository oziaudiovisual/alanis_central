const pool = require('../config/database');

const Transaction = {
    async create(data) {
        const result = await pool.query(
            `INSERT INTO transactions 
       (cakto_id, event_type, customer_name, customer_email, customer_phone, 
        customer_doc, product_name, product_id, offer_id, amount, 
        payment_method, status, raw_payload)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
            [
                data.cakto_id, data.event_type, data.customer_name, data.customer_email,
                data.customer_phone, data.customer_doc, data.product_name, data.product_id,
                data.offer_id, data.amount, data.payment_method, data.status, data.raw_payload
            ]
        );
        return result.rows[0];
    },

    async findAll({ page = 1, limit = 20, eventType, search } = {}) {
        const offset = (page - 1) * limit;
        let where = [];
        let params = [];
        let paramIdx = 1;

        if (eventType) {
            where.push(`event_type = $${paramIdx++}`);
            params.push(eventType);
        }
        if (search) {
            where.push(`(customer_name ILIKE $${paramIdx} OR customer_email ILIKE $${paramIdx})`);
            params.push(`%${search}%`);
            paramIdx++;
        }

        const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

        const countResult = await pool.query(
            `SELECT COUNT(*) FROM transactions ${whereClause}`,
            params
        );
        const total = parseInt(countResult.rows[0].count);

        const result = await pool.query(
            `SELECT * FROM transactions ${whereClause} ORDER BY received_at DESC LIMIT $${paramIdx++} OFFSET $${paramIdx}`,
            [...params, limit, offset]
        );

        return {
            transactions: result.rows,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        };
    },

    async findById(id) {
        const result = await pool.query('SELECT * FROM transactions WHERE id = $1', [id]);
        return result.rows[0] || null;
    },

    async getStats() {
        const result = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE event_type = 'compra_aprovada') AS approved,
        COUNT(*) FILTER (WHERE event_type = 'compra_recusada') AS refused,
        COUNT(*) FILTER (WHERE event_type = 'pix_gerado') AS pix_generated,
        COUNT(*) FILTER (WHERE event_type = 'reembolso') AS refunds,
        COUNT(*) FILTER (WHERE event_type = 'chargeback') AS chargebacks,
        COUNT(*) AS total,
        COALESCE(SUM(amount) FILTER (WHERE event_type = 'compra_aprovada'), 0)
          - COALESCE(SUM(amount) FILTER (WHERE event_type = 'reembolso'), 0)
          - COALESCE(SUM(amount) FILTER (WHERE event_type = 'chargeback'), 0)
        AS total_revenue
      FROM transactions
    `);
        return result.rows[0];
    },

    async getRecentByDays(days = 30) {
        const result = await pool.query(`
      SELECT 
        DATE(received_at) as date,
        event_type,
        COUNT(*) as count
      FROM transactions
      WHERE received_at >= NOW() - INTERVAL '1 day' * $1
      GROUP BY DATE(received_at), event_type
      ORDER BY date ASC
    `, [days]);
        return result.rows;
    },

    async getRecent(limit = 10) {
        const result = await pool.query(
            'SELECT * FROM transactions ORDER BY received_at DESC LIMIT $1',
            [limit]
        );
        return result.rows;
    }
};

module.exports = Transaction;
