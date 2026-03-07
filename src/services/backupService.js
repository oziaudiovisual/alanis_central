const { Resend } = require('resend');
const pool = require('../config/database');

const resend = new Resend(process.env.RESEND_API_KEY);
const BACKUP_EMAIL = 'mariolellis@gmail.com';
const FROM = 'Alanis Backup <noreply@licencas.alanis.digital>';

function toCsv(rows, columns) {
    if (!rows || rows.length === 0) return columns.join(',') + '\n';
    const header = columns.join(',');
    const lines = rows.map(row =>
        columns.map(col => {
            const val = row[col];
            if (val === null || val === undefined) return '';
            const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
            // Escape quotes and wrap in quotes
            return `"${str.replace(/"/g, '""')}"`;
        }).join(',')
    );
    return header + '\n' + lines.join('\n');
}

async function runBackup() {
    const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    console.log(`\n📦 Starting daily backup (${timestamp})...`);

    try {
        // Export all tables
        const [buyers, transactions, licenses, admins] = await Promise.all([
            pool.query('SELECT * FROM buyers ORDER BY id'),
            pool.query('SELECT id, cakto_id, event_type, customer_name, customer_email, customer_phone, customer_doc, product_name, product_id, offer_id, amount, payment_method, status, received_at FROM transactions ORDER BY id'),
            pool.query('SELECT * FROM licenses ORDER BY created_at'),
            pool.query('SELECT id, email, webhook_secret, created_at, updated_at FROM admin ORDER BY id'),
        ]);

        const buyersCsv = toCsv(buyers.rows, ['id', 'email', 'name', 'phone', 'doc', 'status', 'first_purchase_at', 'last_event_at', 'total_spent', 'created_at', 'updated_at']);
        const transactionsCsv = toCsv(transactions.rows, ['id', 'cakto_id', 'event_type', 'customer_name', 'customer_email', 'customer_phone', 'customer_doc', 'product_name', 'product_id', 'offer_id', 'amount', 'payment_method', 'status', 'received_at']);
        const licensesCsv = toCsv(licenses.rows, ['id', 'license_key', 'email', 'name', 'phone', 'doc', 'status', 'plan', 'max_instances', 'instances', 'transaction_id', 'created_at', 'expires_at', 'last_validated_at', 'cancel_reason']);
        const adminsCsv = toCsv(admins.rows, ['id', 'email', 'webhook_secret', 'created_at', 'updated_at']);

        const attachments = [
            { filename: `compradores_${timestamp}.csv`, content: Buffer.from('\uFEFF' + buyersCsv, 'utf-8') },
            { filename: `transacoes_${timestamp}.csv`, content: Buffer.from('\uFEFF' + transactionsCsv, 'utf-8') },
            { filename: `licencas_${timestamp}.csv`, content: Buffer.from('\uFEFF' + licensesCsv, 'utf-8') },
            { filename: `admin_${timestamp}.csv`, content: Buffer.from('\uFEFF' + adminsCsv, 'utf-8') },
        ];

        const summary = `
            <div style="font-family:Inter,sans-serif;color:#ffffff;background:#1a1a1a;padding:32px;border-radius:12px;">
                <h2 style="color:#04ffc2;margin:0 0 16px;">📦 Backup Diário — ${timestamp}</h2>
                <table style="width:100%;border-collapse:collapse;">
                    <tr style="border-bottom:1px solid #333;">
                        <td style="padding:8px;color:#a3a3a3;">Compradores</td>
                        <td style="padding:8px;color:#fff;font-weight:600;">${buyers.rows.length} registros</td>
                    </tr>
                    <tr style="border-bottom:1px solid #333;">
                        <td style="padding:8px;color:#a3a3a3;">Transações</td>
                        <td style="padding:8px;color:#fff;font-weight:600;">${transactions.rows.length} registros</td>
                    </tr>
                    <tr style="border-bottom:1px solid #333;">
                        <td style="padding:8px;color:#a3a3a3;">Licenças</td>
                        <td style="padding:8px;color:#fff;font-weight:600;">${licenses.rows.length} registros</td>
                    </tr>
                    <tr>
                        <td style="padding:8px;color:#a3a3a3;">Admin</td>
                        <td style="padding:8px;color:#fff;font-weight:600;">${admins.rows.length} registros</td>
                    </tr>
                </table>
                <p style="margin:16px 0 0;font-size:12px;color:#737373;">
                    Backup gerado automaticamente às ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                </p>
            </div>
        `;

        const { error } = await resend.emails.send({
            from: FROM,
            to: BACKUP_EMAIL,
            subject: `📦 Backup Alanis Central — ${timestamp}`,
            html: summary,
            attachments,
        });

        if (error) {
            console.error('Backup email error:', error);
            return false;
        }

        console.log(`✅ Backup sent to ${BACKUP_EMAIL} (${attachments.length} files)`);
        return true;
    } catch (err) {
        console.error('Backup failed:', err.message);
        return false;
    }
}

module.exports = { runBackup };
