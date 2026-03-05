-- Alanis Central de Vendas - Initial Schema
-- Migration 001

-- Admin table (single user)
CREATE TABLE IF NOT EXISTS admin (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    webhook_secret VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Transactions table (all webhook events)
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    cakto_id VARCHAR(255),
    event_type VARCHAR(50) NOT NULL,
    customer_name VARCHAR(255),
    customer_email VARCHAR(255),
    customer_phone VARCHAR(50),
    customer_doc VARCHAR(50),
    product_name VARCHAR(255),
    product_id VARCHAR(255),
    offer_id VARCHAR(255),
    amount DECIMAL(10,2),
    payment_method VARCHAR(50),
    status VARCHAR(50),
    raw_payload JSONB,
    received_at TIMESTAMP DEFAULT NOW()
);

-- Buyers table (consolidated buyer list)
CREATE TABLE IF NOT EXISTS buyers (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255),
    phone VARCHAR(50),
    doc VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active',
    first_purchase_at TIMESTAMP,
    last_event_at TIMESTAMP,
    total_spent DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Session table (for express-session with connect-pg-simple)
CREATE TABLE IF NOT EXISTS "session" (
    "sid" VARCHAR NOT NULL COLLATE "default",
    "sess" JSON NOT NULL,
    "expire" TIMESTAMP(6) NOT NULL,
    CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
) WITH (OIDS=FALSE);
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");

-- Indexes
CREATE INDEX IF NOT EXISTS idx_transactions_email ON transactions(customer_email);
CREATE INDEX IF NOT EXISTS idx_transactions_event ON transactions(event_type);
CREATE INDEX IF NOT EXISTS idx_transactions_received ON transactions(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_buyers_status ON buyers(status);
CREATE INDEX IF NOT EXISTS idx_buyers_email ON buyers(email);
