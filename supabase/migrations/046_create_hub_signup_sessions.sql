-- =========================================================
-- PARTNERS HUB: SIGNUP SESSIONS (Story 14.5 / 14.9)
-- =========================================================
-- Table temporaire pour le tunnel d'inscription (étapes 1 à 4).
-- Données : step1 (account_type, email, is_llc_client), step3 (country, profession, bio), etc.
-- Accès via service role uniquement (API backend).
-- =========================================================

CREATE TABLE hub_signup_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_type text,
  email text,
  is_llc_client boolean DEFAULT false,
  existing_user_id uuid REFERENCES profiles(id),
  expires_at timestamptz NOT NULL,
  country char(2),
  profession text,
  bio varchar(300),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_hub_signup_sessions_expires_at ON hub_signup_sessions(expires_at);

COMMENT ON TABLE hub_signup_sessions IS 'Sessions temporaires tunnel inscription Partners Hub (TTL 24h)';
COMMENT ON COLUMN hub_signup_sessions.country IS 'ISO 3166-1 alpha-2 (step3)';
COMMENT ON COLUMN hub_signup_sessions.bio IS 'Bio step3, max 300 caractères';

ALTER TABLE hub_signup_sessions ENABLE ROW LEVEL SECURITY;

-- Aucune policy : accès uniquement via service role (API)

CREATE TRIGGER set_hub_signup_sessions_updated_at
  BEFORE UPDATE ON hub_signup_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
