-- =========================================================
-- PARTNERS HUB: MARKETPLACE (Story hub-marketplace)
-- =========================================================
-- Tables: hub_marketplace_listings, hub_marketplace_inquiries
-- RLS: lecture publique (membres Hub), écriture sur ses propres entrées
-- Rollback: supabase/rollbacks/051_hub_marketplace_down.sql
-- =========================================================

-- ── Enums ──────────────────────────────────────────────────

CREATE TYPE marketplace_listing_status AS ENUM ('draft', 'published', 'paused', 'archived');
CREATE TYPE marketplace_price_type     AS ENUM ('fixed', 'quote', 'free');

-- ── Tables ─────────────────────────────────────────────────

CREATE TABLE hub_marketplace_listings (
  id              uuid                      PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_user_id  uuid                      NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title           text                      NOT NULL CHECK (char_length(title) BETWEEN 3 AND 100),
  description     text                      NOT NULL CHECK (char_length(description) BETWEEN 10 AND 2000),
  category        text                      NOT NULL,
  price_type      marketplace_price_type    NOT NULL DEFAULT 'quote',
  price_amount    numeric(10, 2)            CHECK (price_amount IS NULL OR price_amount >= 0),
  tags            text[]                    NOT NULL DEFAULT '{}',
  status          marketplace_listing_status NOT NULL DEFAULT 'draft',
  created_at      timestamptz               NOT NULL DEFAULT now(),
  updated_at      timestamptz               NOT NULL DEFAULT now()
);

CREATE TABLE hub_marketplace_inquiries (
  id              uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id      uuid    NOT NULL REFERENCES hub_marketplace_listings(id) ON DELETE CASCADE,
  buyer_user_id   uuid    NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message         text    NOT NULL CHECK (char_length(message) BETWEEN 10 AND 500),
  status          text    NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'replied', 'closed')),
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Trigger : empêche un vendeur de s'envoyer une inquiry sur sa propre offre
CREATE OR REPLACE FUNCTION check_inquiry_no_self()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.buyer_user_id = (
    SELECT seller_user_id FROM hub_marketplace_listings WHERE id = NEW.listing_id
  ) THEN
    RAISE EXCEPTION 'Vous ne pouvez pas envoyer une inquiry sur votre propre offre';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_inquiry_no_self
  BEFORE INSERT ON hub_marketplace_inquiries
  FOR EACH ROW EXECUTE FUNCTION check_inquiry_no_self();

-- ── Indexes ────────────────────────────────────────────────

CREATE INDEX idx_hub_marketplace_listings_seller  ON hub_marketplace_listings(seller_user_id);
CREATE INDEX idx_hub_marketplace_listings_status  ON hub_marketplace_listings(status);
CREATE INDEX idx_hub_marketplace_listings_cat     ON hub_marketplace_listings(category);
CREATE INDEX idx_hub_marketplace_inquiries_listing ON hub_marketplace_inquiries(listing_id);
CREATE INDEX idx_hub_marketplace_inquiries_buyer   ON hub_marketplace_inquiries(buyer_user_id);

-- ── Triggers ───────────────────────────────────────────────

CREATE TRIGGER set_hub_marketplace_listings_updated_at
  BEFORE UPDATE ON hub_marketplace_listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── RLS ────────────────────────────────────────────────────

ALTER TABLE hub_marketplace_listings  ENABLE ROW LEVEL SECURITY;
ALTER TABLE hub_marketplace_inquiries ENABLE ROW LEVEL SECURITY;

-- Listings : lecture par tous les membres Hub (publiées uniquement)
CREATE POLICY "Hub members can view published listings"
  ON hub_marketplace_listings FOR SELECT
  USING (status = 'published' AND is_hub_member(auth.uid()));

-- Listings : le vendeur voit aussi ses brouillons/archivées
CREATE POLICY "Seller sees own listings"
  ON hub_marketplace_listings FOR SELECT
  USING (seller_user_id = auth.uid());

-- Listings : insertion / mise à jour / suppression sur ses propres entrées
CREATE POLICY "Seller can insert own listing"
  ON hub_marketplace_listings FOR INSERT
  WITH CHECK (seller_user_id = auth.uid() AND is_hub_member(auth.uid()));

CREATE POLICY "Seller can update own listing"
  ON hub_marketplace_listings FOR UPDATE
  USING (seller_user_id = auth.uid())
  WITH CHECK (seller_user_id = auth.uid());

CREATE POLICY "Seller can delete own listing"
  ON hub_marketplace_listings FOR DELETE
  USING (seller_user_id = auth.uid());

-- Inquiries : lecture par l'acheteur OU le vendeur
CREATE POLICY "Parties can view inquiry"
  ON hub_marketplace_inquiries FOR SELECT
  USING (
    buyer_user_id = auth.uid()
    OR listing_id IN (
      SELECT id FROM hub_marketplace_listings WHERE seller_user_id = auth.uid()
    )
  );

CREATE POLICY "Hub member can send inquiry"
  ON hub_marketplace_inquiries FOR INSERT
  WITH CHECK (buyer_user_id = auth.uid() AND is_hub_member(auth.uid()));
