-- Alanis Central de Vendas - Licensing Schema
-- Migration 002

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS licenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    license_key VARCHAR(64) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    phone VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled', 'expired')),
    plan VARCHAR(100) DEFAULT 'default',
    max_instances INT DEFAULT 1,
    instances JSONB DEFAULT '[]'::jsonb,
    transaction_id INT REFERENCES transactions(id),
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,
    last_validated_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_licenses_key ON licenses(license_key);
CREATE INDEX IF NOT EXISTS idx_licenses_email ON licenses(email);
CREATE INDEX IF NOT EXISTS idx_licenses_status ON licenses(status);
