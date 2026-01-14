-- =========================================================
-- ADD STATUS COLUMN TO PAYMENT_LINKS
-- =========================================================
-- This migration adds the status column to track payment link state
-- =========================================================

-- Add status column to payment_links table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payment_links' AND column_name = 'status'
  ) THEN
    ALTER TABLE payment_links
    ADD COLUMN status TEXT NOT NULL DEFAULT 'ACTIVE'
    CHECK (status IN ('ACTIVE', 'USED', 'EXPIRED'));

    CREATE INDEX idx_payment_links_status ON payment_links(status);
  END IF;
END $$;

-- Update existing records: set USED if used_at is not null, EXPIRED if expires_at passed
UPDATE payment_links
SET status = CASE
  WHEN used_at IS NOT NULL THEN 'USED'
  WHEN expires_at IS NOT NULL AND expires_at < NOW() THEN 'EXPIRED'
  ELSE 'ACTIVE'
END
WHERE status = 'ACTIVE';

-- Trigger to auto-update status to EXPIRED when expires_at passes
CREATE OR REPLACE FUNCTION update_expired_payment_links()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expires_at IS NOT NULL AND NEW.expires_at < NOW() AND NEW.status = 'ACTIVE' THEN
    NEW.status = 'EXPIRED';
  END IF;

  IF NEW.used_at IS NOT NULL AND OLD.used_at IS NULL THEN
    NEW.status = 'USED';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS payment_links_status_update ON payment_links;

CREATE TRIGGER payment_links_status_update
  BEFORE INSERT OR UPDATE ON payment_links
  FOR EACH ROW
  EXECUTE FUNCTION update_expired_payment_links();

-- Comment
COMMENT ON COLUMN payment_links.status IS 'Payment link status: ACTIVE (not used), USED (clicked and registered), EXPIRED (past expiration date or manually expired)';
