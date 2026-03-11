-- Migration 006: Clear incorrect activated_domain values
-- The header fallback was capturing 'central.alanis.digital' (the Central's own domain)
-- instead of the client's platform domain. Reset all to NULL so correct values are populated.

UPDATE licenses SET activated_domain = NULL WHERE activated_domain = 'central.alanis.digital';
