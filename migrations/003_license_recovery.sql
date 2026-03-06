-- Alanis Central de Vendas - License Recovery Support
-- Migration 003

ALTER TABLE licenses ADD COLUMN IF NOT EXISTS doc VARCHAR(50);
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS cancel_reason VARCHAR(50);
