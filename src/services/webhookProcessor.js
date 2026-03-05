const Transaction = require('../models/transaction');
const Buyer = require('../models/buyer');

const EVENT_TYPES = {
    COMPRA_APROVADA: 'compra_aprovada',
    COMPRA_RECUSADA: 'compra_recusada',
    PIX_GERADO: 'pix_gerado',
    REEMBOLSO: 'reembolso',
    CHARGEBACK: 'chargeback',
};

async function processWebhook(event, data, rawPayload) {
    // Normalize event name
    const eventType = normalizeEvent(event);
    if (!eventType) {
        console.warn(`Unknown webhook event: ${event}`);
        return { success: false, reason: 'unknown_event' };
    }

    // Extract customer info
    const customer = data.customer || {};
    const product = data.product || {};

    // Create transaction record
    const transaction = await Transaction.create({
        cakto_id: data.id || data.refId || null,
        event_type: eventType,
        customer_name: customer.name || null,
        customer_email: customer.email || null,
        customer_phone: customer.phone || null,
        customer_doc: customer.doc || null,
        product_name: product.name || null,
        product_id: product.id || null,
        offer_id: product.offerId || null,
        amount: data.amount || data.value || null,
        payment_method: data.paymentMethod || data.payment_method || null,
        status: data.status || eventType,
        raw_payload: rawPayload,
    });

    // Update buyer status based on event
    if (customer.email) {
        await updateBuyerFromEvent(eventType, customer, data);
    }

    console.log(`Webhook processed: ${eventType} | ${customer.email || 'unknown'} | TX#${transaction.id}`);
    return { success: true, transactionId: transaction.id };
}

async function updateBuyerFromEvent(eventType, customer, data) {
    switch (eventType) {
        case EVENT_TYPES.COMPRA_APROVADA:
            await Buyer.upsert({
                email: customer.email,
                name: customer.name,
                phone: customer.phone,
                doc: customer.doc,
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
    };

    return mapping[normalized] || null;
}

module.exports = { processWebhook, EVENT_TYPES };
