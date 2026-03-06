const { Resend } = require('resend');
const { welcomeEmail, chargebackEmail, refundEmail } = require('./emailTemplates');

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = 'Alanis <no-reply@alanis.digital>';

async function sendWelcomeEmail(to, name, licenseKey, plan) {
    try {
        const { data, error } = await resend.emails.send({
            from: FROM,
            to,
            subject: '🎉 Bem-vindo à Alanis — Aqui está sua licença!',
            html: welcomeEmail(name, licenseKey, plan),
        });

        if (error) {
            console.error('Email error (welcome):', error);
            return false;
        }

        console.log(`✉️  Welcome email sent to ${to} (id: ${data.id})`);
        return true;
    } catch (err) {
        console.error('Email send failed (welcome):', err.message);
        return false;
    }
}

async function sendChargebackEmail(to, name) {
    try {
        const { data, error } = await resend.emails.send({
            from: FROM,
            to,
            subject: '⚠️ Chargeback detectado — Ação necessária',
            html: chargebackEmail(name),
        });

        if (error) {
            console.error('Email error (chargeback):', error);
            return false;
        }

        console.log(`✉️  Chargeback email sent to ${to} (id: ${data.id})`);
        return true;
    } catch (err) {
        console.error('Email send failed (chargeback):', err.message);
        return false;
    }
}

async function sendRefundEmail(to, name) {
    try {
        const { data, error } = await resend.emails.send({
            from: FROM,
            to,
            subject: 'Reembolso processado — Alanis',
            html: refundEmail(name),
        });

        if (error) {
            console.error('Email error (refund):', error);
            return false;
        }

        console.log(`✉️  Refund email sent to ${to} (id: ${data.id})`);
        return true;
    } catch (err) {
        console.error('Email send failed (refund):', err.message);
        return false;
    }
}

module.exports = { sendWelcomeEmail, sendChargebackEmail, sendRefundEmail };
