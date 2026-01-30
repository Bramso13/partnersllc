-- =========================================================
-- ORDER_PAYMENTS TABLE - Story 9.4 Acomptes, Commandes, Paiements multiples
-- =========================================================
-- Table pour enregistrer les paiements liés à une commande (virement, chèque, etc.)
-- Une commande peut avoir plusieurs lignes dans order_payments.
-- =========================================================

CREATE TABLE IF NOT EXISTS order_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  amount integer NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'EUR',
  payment_method text CHECK (payment_method IN ('VIREMENT', 'CHEQUE', 'STRIPE', 'AUTRE')),
  paid_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_order_payments_order_id ON order_payments(order_id);
CREATE INDEX IF NOT EXISTS idx_order_payments_paid_at ON order_payments(paid_at);

COMMENT ON TABLE order_payments IS 'Paiements enregistrés manuellement ou via Stripe pour une commande';
COMMENT ON COLUMN order_payments.amount IS 'Montant en centimes';
COMMENT ON COLUMN order_payments.payment_method IS 'VIREMENT, CHEQUE, STRIPE, AUTRE';

-- =========================================================
-- RLS
-- =========================================================
ALTER TABLE order_payments ENABLE ROW LEVEL SECURITY;

-- Admins can do everything on order_payments
CREATE POLICY "Admins can manage order_payments"
  ON order_payments
  FOR ALL
  USING (auth.role() = 'ADMIN')
  WITH CHECK (auth.role() = 'ADMIN');
