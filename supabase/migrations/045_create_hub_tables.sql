-- =========================================================
-- PARTNERS HUB: SUBSCRIPTIONS & MEMBER PROFILES (Story 14.4)
-- =========================================================
-- Creates tables and relations for Partners Hub:
-- - hub_subscriptions: abonnements (plan, status, Stripe)
-- - hub_member_profiles: profils membres (display_name, country, etc.)
-- - Enum user_role: ajout de 'hub_member'
-- - RLS: subscriptions privées, profils visibles par tous les membres Hub
--
-- Rollback: voir supabase/rollbacks/045_create_hub_tables_down.sql
-- =========================================================
-- UP (appliqué automatiquement par supabase migration up)
-- =========================================================

-- =========================================================
-- 1. ENUMS
-- =========================================================

-- Plan d'abonnement Hub
CREATE TYPE hub_subscription_plan AS ENUM ('monthly', 'yearly');

-- Statut d'abonnement
CREATE TYPE hub_subscription_status AS ENUM ('active', 'cancelled', 'expired', 'suspended');

-- Ajouter 'hub_member' à user_role (enum existant)
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'hub_member';

COMMENT ON TYPE hub_subscription_plan IS 'Plan Partners Hub: monthly or yearly';
COMMENT ON TYPE hub_subscription_status IS 'Subscription status: active, cancelled, expired, suspended';

-- =========================================================
-- 2. TABLE: hub_subscriptions
-- =========================================================

CREATE TABLE hub_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan hub_subscription_plan NOT NULL,
  status hub_subscription_status NOT NULL,
  started_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  stripe_subscription_id text,
  stripe_customer_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT hub_subscriptions_user_id_key UNIQUE (user_id)
);

CREATE INDEX idx_hub_subscriptions_user_id ON hub_subscriptions(user_id);
CREATE INDEX idx_hub_subscriptions_status ON hub_subscriptions(status);

COMMENT ON TABLE hub_subscriptions IS 'Partners Hub subscriptions: one per user, linked to Stripe';
COMMENT ON COLUMN hub_subscriptions.stripe_subscription_id IS 'Stripe subscription ID (sub_xxx)';
COMMENT ON COLUMN hub_subscriptions.stripe_customer_id IS 'Stripe customer ID (cus_xxx)';

-- =========================================================
-- 3. TABLE: hub_member_profiles
-- =========================================================

CREATE TABLE hub_member_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  display_name text,
  country char(2),
  profession text,
  bio varchar(300),
  is_llc_client boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT hub_member_profiles_user_id_key UNIQUE (user_id)
);

CREATE INDEX idx_hub_member_profiles_user_id ON hub_member_profiles(user_id);
CREATE INDEX idx_hub_member_profiles_country ON hub_member_profiles(country);

COMMENT ON TABLE hub_member_profiles IS 'Partners Hub member profiles: one per user, visible to all Hub members';
COMMENT ON COLUMN hub_member_profiles.country IS 'ISO 3166-1 alpha-2 (e.g. FR, US)';
COMMENT ON COLUMN hub_member_profiles.bio IS 'Short bio, max 300 characters';

-- =========================================================
-- 4. TRIGGER: updated_at
-- =========================================================

CREATE TRIGGER set_hub_subscriptions_updated_at
  BEFORE UPDATE ON hub_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_hub_member_profiles_updated_at
  BEFORE UPDATE ON hub_member_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =========================================================
-- 5. RLS
-- =========================================================

ALTER TABLE hub_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE hub_member_profiles ENABLE ROW LEVEL SECURITY;

-- Helper: user has an active Hub subscription (is a Hub member)
CREATE OR REPLACE FUNCTION is_hub_member(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM hub_subscriptions
    WHERE user_id = uid AND status = 'active'
  );
$$;

COMMENT ON FUNCTION is_hub_member(uuid) IS 'True if the user has an active Partners Hub subscription';

-- hub_subscriptions: privées (user voit uniquement la sienne)
CREATE POLICY "Users can view own subscription"
  ON hub_subscriptions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own subscription"
  ON hub_subscriptions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own subscription"
  ON hub_subscriptions FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- hub_member_profiles: lecture par tous les membres Hub, écriture sur son propre profil
CREATE POLICY "Hub members can view all member profiles"
  ON hub_member_profiles FOR SELECT
  USING (is_hub_member(auth.uid()));

CREATE POLICY "Users can insert own member profile"
  ON hub_member_profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own member profile"
  ON hub_member_profiles FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own member profile"
  ON hub_member_profiles FOR DELETE
  USING (user_id = auth.uid());
