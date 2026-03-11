const pool = require('../config/database');
const crypto = require('crypto');

function generateKey() {
    return crypto.randomUUID().replace(/-/g, '').toUpperCase();
}

const License = {
    async create({ email, name, phone, doc, plan, transactionId, maxInstances, expiresAt }) {
        const key = generateKey();
        const result = await pool.query(
            `INSERT INTO licenses (license_key, email, name, phone, doc, plan, transaction_id, max_instances, expires_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING *`,
            [key, email, name || null, phone || null, doc || null, plan || 'default', transactionId || null, maxInstances || 1, expiresAt || null]
        );
        return result.rows[0];
    },

    async findByKey(key) {
        const result = await pool.query('SELECT * FROM licenses WHERE license_key = $1', [key]);
        return result.rows[0] || null;
    },

    async findByEmail(email) {
        const result = await pool.query(
            'SELECT * FROM licenses WHERE email = $1 ORDER BY created_at DESC',
            [email]
        );
        return result.rows;
    },

    async validate(key, instanceId, domain) {
        const license = await this.findByKey(key);
        if (!license) return { valid: false, reason: 'not_found' };
        if (license.status !== 'active') return { valid: false, reason: 'inactive', status: license.status };
        if (license.expires_at && new Date(license.expires_at) < new Date()) {
            await pool.query("UPDATE licenses SET status = 'expired' WHERE id = $1", [license.id]);
            return { valid: false, reason: 'expired' };
        }

        // Save activated domain (always update to keep it current)
        if (domain && domain !== license.activated_domain) {
            await pool.query(
                'UPDATE licenses SET activated_domain = $1 WHERE id = $2',
                [domain, license.id]
            );
        }

        // Instance management
        const instances = license.instances || [];
        if (instanceId) {
            const alreadyRegistered = instances.includes(instanceId);
            if (!alreadyRegistered) {
                if (instances.length >= license.max_instances) {
                    return { valid: false, reason: 'max_instances_reached', max: license.max_instances };
                }
                instances.push(instanceId);
                await pool.query(
                    'UPDATE licenses SET instances = $1, last_validated_at = NOW() WHERE id = $2',
                    [JSON.stringify(instances), license.id]
                );
            } else {
                await pool.query('UPDATE licenses SET last_validated_at = NOW() WHERE id = $1', [license.id]);
            }
        } else {
            await pool.query('UPDATE licenses SET last_validated_at = NOW() WHERE id = $1', [license.id]);
        }

        return {
            valid: true,
            license: {
                plan: license.plan,
                email: license.email,
                expiresAt: license.expires_at,
                instances: instances.length,
                maxInstances: license.max_instances,
            },
        };
    },

    async revokeByEmail(email, reason) {
        const result = await pool.query(
            "UPDATE licenses SET status = 'cancelled', cancel_reason = $1 WHERE email = $2 AND status = 'active' RETURNING *",
            [reason, email]
        );
        return result.rows;
    },

    async findByEmailAndDoc(email, doc) {
        const cleanDoc = doc.replace(/[^\d]/g, '');
        const result = await pool.query(
            'SELECT * FROM licenses WHERE email = $1 AND doc = $2 ORDER BY created_at DESC',
            [email, cleanDoc]
        );
        return result.rows;
    },

    async revokeByKey(key) {
        const result = await pool.query(
            "UPDATE licenses SET status = 'cancelled' WHERE license_key = $1 RETURNING *",
            [key]
        );
        return result.rows[0] || null;
    },

    async reactivate(id, hours) {
        const expiresAt = hours ? new Date(Date.now() + hours * 60 * 60 * 1000) : null;
        const result = await pool.query(
            `UPDATE licenses SET status = 'active', expires_at = $1, instances = '[]'::jsonb WHERE id = $2 RETURNING *`,
            [expiresAt, id]
        );
        return result.rows[0] || null;
    },

    async findAll({ page = 1, limit = 25, status, search }) {
        let where = [];
        let params = [];
        let idx = 1;

        if (status && status !== 'all') {
            where.push(`status = $${idx++}`);
            params.push(status);
        }
        if (search) {
            where.push(`(email ILIKE $${idx} OR name ILIKE $${idx} OR license_key ILIKE $${idx})`);
            params.push(`%${search}%`);
            idx++;
        }

        const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';
        const offset = (page - 1) * limit;

        const countResult = await pool.query(
            `SELECT COUNT(*) FROM licenses ${whereClause}`, params
        );
        const total = parseInt(countResult.rows[0].count);

        params.push(limit);
        params.push(offset);
        const result = await pool.query(
            `SELECT * FROM licenses ${whereClause} ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx}`,
            params
        );

        return { licenses: result.rows, total, totalPages: Math.ceil(total / limit) };
    },

    async resetInstances(id) {
        const result = await pool.query(
            `UPDATE licenses SET instances = '[]'::jsonb, activated_domain = NULL WHERE id = $1 RETURNING *`,
            [id]
        );
        return result.rows[0] || null;
    },

    async countByStatus() {
        const result = await pool.query(`
            SELECT status, COUNT(*) as count FROM licenses GROUP BY status
        `);
        const counts = { active: 0, suspended: 0, cancelled: 0, expired: 0, total: 0 };
        result.rows.forEach(r => {
            counts[r.status] = parseInt(r.count);
            counts.total += parseInt(r.count);
        });
        return counts;
    },
};

module.exports = License;
