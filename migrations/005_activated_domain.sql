-- Alanis Central de Vendas - Activated Domain Tracking
-- Migration 005

ALTER TABLE licenses ADD COLUMN IF NOT EXISTS activated_domain VARCHAR(255);
