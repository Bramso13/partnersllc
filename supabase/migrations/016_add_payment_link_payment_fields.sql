-- =========================================================
-- ADD PAYMENT TRACKING FIELDS TO PAYMENT_LINKS
-- =========================================================
-- This migration adds fields to track payment completion for the inverted registration flow
-- =========================================================

-- Add payment tracking fields to payment_links table
DO $$
BEGIN
  -- Add updated_at timestamp (standard Supabase column)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payment_links' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE payment_links
    ADD COLUMN updated_at timestamptz default now();
  END IF;

  -- Add paid_at timestamp
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payment_links' AND column_name = 'paid_at'
  ) THEN
    ALTER TABLE payment_links
    ADD COLUMN paid_at timestamptz;
  END IF;

  -- Add stripe_customer_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payment_links' AND column_name = 'stripe_customer_id'
  ) THEN
    ALTER TABLE payment_links
    ADD COLUMN stripe_customer_id text;
  END IF;

  -- Add amount_paid
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payment_links' AND column_name = 'amount_paid'
  ) THEN
    ALTER TABLE payment_links
    ADD COLUMN amount_paid integer;
  END IF;

  -- Add order_id reference
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payment_links' AND column_name = 'order_id'
  ) THEN
    ALTER TABLE payment_links
    ADD COLUMN order_id uuid references orders(id) on delete set null;
  END IF;
END $$;

-- Update status enum to include PAID and PAYMENT_INITIATED
ALTER TABLE payment_links
DROP CONSTRAINT IF EXISTS payment_links_status_check;

ALTER TABLE payment_links
ADD CONSTRAINT payment_links_status_check
CHECK (status IN ('ACTIVE', 'PAYMENT_INITIATED', 'PAID', 'USED', 'EXPIRED'));

-- Update trigger to handle new statuses
CREATE OR REPLACE FUNCTION update_expired_payment_links()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-expire when expires_at passes
  IF NEW.expires_at IS NOT NULL AND NEW.expires_at < NOW() AND NEW.status IN ('ACTIVE', 'PAYMENT_INITIATED') THEN
    NEW.status = 'EXPIRED';
  END IF;

  -- Mark as USED when used_at is set
  IF NEW.used_at IS NOT NULL AND OLD.used_at IS NULL THEN
    NEW.status = 'USED';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for new fields
CREATE INDEX IF NOT EXISTS idx_payment_links_paid_at ON payment_links(paid_at);
CREATE INDEX IF NOT EXISTS idx_payment_links_stripe_customer_id ON payment_links(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_payment_links_order_id ON payment_links(order_id);

-- Comments
COMMENT ON COLUMN payment_links.updated_at IS 'Last update timestamp';
COMMENT ON COLUMN payment_links.paid_at IS 'Timestamp when payment was successfully completed';
COMMENT ON COLUMN payment_links.stripe_customer_id IS 'Stripe customer ID created during checkout';
COMMENT ON COLUMN payment_links.amount_paid IS 'Actual amount paid in cents (may differ from product price)';
COMMENT ON COLUMN payment_links.order_id IS 'Reference to the order created during payment completion';