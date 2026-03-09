const Transaction = require('../models/transaction');
const Buyer = require('../models/buyer');
const License = require('../models/license');
const { sendWelcomeEmail, sendChargebackEmail, sendRefundEmail } = require('./emailService');

const EVENT_TYPES = {
    COMPRA_APROVADA: 'compra_aprovada',
    COMPRA_RECUSADA: 'compra_recusada',
    PIX_GERADO: 'pix_gerado',
    REEMBOLSO: 'reembolso',
    CHARGEBACK: 'chargeback',
    CHECKOUT_ABANDONADO: 'checkout_abandonado',
};

async function processWebhook(event, data, rawPayload) {
    // Normalize event name
    const eventType = normalizeEvent(event);
    if (!eventType) {
        console.warn(`Unknown webhook event: ${event}`);
        return { success: false, reason: 'unknown_event' };
    }

    // Extract customer info (Cakto uses docNumber, not doc)
    const customer = data.customer || {};
    const product = data.product || {};
    const offer = data.offer || {};
    const customerDoc = customer.docNumber || customer.doc || null;

    // PIX consolidation: when purchase_approved arrives, update the matching pix_gerado transaction
    if (eventType === EVENT_TYPES.COMPRA_APROVADA) {
        await Transaction.consolidatePix(customer.email, product.id || offer.id);
    }

    // Create transaction record
    const transaction = await Transaction.create({
        cakto_id: data.id || data.refId || null,
        event_type: eventType,
        customer_name: customer.name || null,
        customer_email: customer.email || null,
        customer_phone: customer.phone || null,
        customer_doc: customerDoc,
        product_name: product.name || offer.name || null,
        product_id: product.id || null,
        offer_id: offer.id || product.offerId || null,
        amount: data.amount || data.value || null,
        payment_method: data.paymentMethod || data.payment_method || null,
        status: data.status || eventType,
        raw_payload: rawPayload,
    });

    // Update buyer status based on event
    if (customer.email) {
        await updateBuyerFromEvent(eventType, customer, customerDoc, data);
    }

    // License management
    let licenseKey = null;
    if (customer.email) {
        licenseKey = await handleLicenseEvent(eventType, customer, customerDoc, data, transaction.id);
    }

    console.log(`Webhook processed: ${eventType} | ${customer.email || 'unknown'} | TX#${transaction.id}${licenseKey ? ` | License: ${licenseKey}` : ''}`);
    return { success: true, transactionId: transaction.id, licenseKey };
}

async function updateBuyerFromEvent(eventType, customer, customerDoc, data) {
    switch (eventType) {
        case EVENT_TYPES.COMPRA_APROVADA:
            await Buyer.upsert({
                email: customer.email,
                name: customer.name,
                phone: customer.phone,
                doc: customerDoc,
                status: 'active',
                amount: data.amount || data.value || 0,
            });
            break;

        case EVENT_TYPES.REEMBOLSO:
            await Buyer.updateStatus(customer.email, 'refunded');
            break;

        case EVENT_TYPES.CHARGEBACK:
            await Buyer.updateStatus(customer.email, 'chargeback');
            break;

        // pix_gerado and compra_recusada don't change buyer status
        default:
            break;
    }
}

async function handleLicenseEvent(eventType, customer, customerDoc, data, transactionId) {
    switch (eventType) {
        case EVENT_TYPES.COMPRA_APROVADA: {
            const license = await License.create({
                email: customer.email,
                name: customer.name,
                phone: customer.phone,
                doc: customerDoc,
                plan: data.plan || data.product?.name || data.offer?.name || 'default',
                transactionId,
                maxInstances: data.maxInstances || 1,
                expiresAt: data.expiresAt || null,
            });
            console.log(`License created: ${license.license_key} for ${customer.email}`);
            // Fire-and-forget email
            sendWelcomeEmail(customer.email, customer.name, license.license_key, license.plan).catch(() => { });
            return license.license_key;
        }
        case EVENT_TYPES.REEMBOLSO: {
            const revoked = await License.revokeByEmail(customer.email, 'refund');
            if (revoked.length > 0) {
                console.log(`License revoked (refund): ${customer.email}`);
                sendRefundEmail(customer.email, customer.name).catch(() => { });
            }
            return null;
        }
        case EVENT_TYPES.CHARGEBACK: {
            const revoked = await License.revokeByEmail(customer.email, 'chargeback');
            if (revoked.length > 0) {
                console.log(`License revoked (chargeback): ${customer.email}`);
                sendChargebackEmail(customer.email, customer.name).catch(() => { });
            }
            return null;
        }
        default:
            return null;
    }
}

function normalizeEvent(event) {
    if (!event) return null;
    const normalized = event.toLowerCase().trim().replace(/\s+/g, '_');

    const mapping = {
        'compra_aprovada': EVENT_TYPES.COMPRA_APROVADA,
        'purchase_approved': EVENT_TYPES.COMPRA_APROVADA,
        'approved': EVENT_TYPES.COMPRA_APROVADA,
        'compra_recusada': EVENT_TYPES.COMPRA_RECUSADA,
        'purchase_refused': EVENT_TYPES.COMPRA_RECUSADA,
        'refused': EVENT_TYPES.COMPRA_RECUSADA,
        'pix_gerado': EVENT_TYPES.PIX_GERADO,
        'pix_generated': EVENT_TYPES.PIX_GERADO,
        'reembolso': EVENT_TYPES.REEMBOLSO,
        'refund': EVENT_TYPES.REEMBOLSO,
        'refunded': EVENT_TYPES.REEMBOLSO,
        'chargeback': EVENT_TYPES.CHARGEBACK,
        'charge_back': EVENT_TYPES.CHARGEBACK,
        'checkout_abandonado': EVENT_TYPES.CHECKOUT_ABANDONADO,
        'abandono_de_checkout': EVENT_TYPES.CHECKOUT_ABANDONADO,
        'checkout_abandoned': EVENT_TYPES.CHECKOUT_ABANDONADO,
    };

    return mapping[normalized] || null;
}

module.exports = { processWebhook, EVENT_TYPES };
