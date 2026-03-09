-- Migration 004: Fix total_spent column type to support decimal amounts (e.g. R$ 5.99)

DO $$
BEGIN
    -- Only alter if the column is not already numeric/decimal
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'buyers' AND column_name = 'total_spent' AND data_type = 'integer'
    ) THEN
        ALTER TABLE buyers ALTER COLUMN total_spent TYPE DECIMAL(10,2) USING total_spent::DECIMAL(10,2);
        RAISE NOTICE 'total_spent column altered from INTEGER to DECIMAL(10,2)';
    END IF;
END $$;
