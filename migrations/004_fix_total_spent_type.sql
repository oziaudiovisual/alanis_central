-- Migration 004: Fix total_spent column type to support decimal amounts (e.g. R$ 5.99)
-- Unconditional ALTER - safe to re-run (DECIMAL to DECIMAL is a no-op)

ALTER TABLE buyers
  ALTER COLUMN total_spent TYPE DECIMAL(10,2)
  USING total_spent::DECIMAL(10,2);
