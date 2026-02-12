-- =========================================================
-- PARTNERS HUB: SIGNUP SESSIONS (Story 14.5 / 14.7)
-- =========================================================
-- Table temporaire pour le tunnel d'inscription Hub.
-- TTL 24h : nettoyage manuel ou cron sur expires_at.
-- Step1: account_type, email, is_llc_client, existing_user_id, expires_at
-- Step2: first_name, last_name, email (new), hashed_password, phone
-- =========================================================

CREATE TABLE hub_signup_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Step 1
  account_type text NOT NULL CHECK (account_type IN ('new', 'existing_llc')),
  email text,
  is_llc_client boolean NOT NULL DEFAULT false,
  existing_user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,

  -- Step 2
  first_name text,
  last_name text,
  hashed_password text,
  phone text,

  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_hub_signup_sessions_expires_at ON hub_signup_sessions(expires_at);
CREATE INDEX idx_hub_signup_sessions_id ON hub_signup_sessions(id);

COMMENT ON TABLE hub_signup_sessions IS 'Temporary signup tunnel sessions (Partners Hub), TTL 24h via expires_at';
COMMENT ON COLUMN hub_signup_sessions.account_type IS 'new = nouveau membre, existing_llc = client Partners LLC';
COMMENT ON COLUMN hub_signup_sessions.is_llc_client IS 'True when email was found in profiles with role CLIENT';
COMMENT ON COLUMN hub_signup_sessions.existing_user_id IS 'Set when account_type=existing_llc and client found';
COMMENT ON COLUMN hub_signup_sessions.hashed_password IS 'bcrypt hash, only for account_type=new';

-- Trigger updated_at
CREATE TRIGGER set_hub_signup_sessions_updated_at
  BEFORE UPDATE ON hub_signup_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =========================================================
-- FUNCTION: get profile id + role by email (auth.users join profiles)
-- =========================================================
-- Utilisée par l'API step1 pour vérifier si un email est un client LLC.
CREATE OR REPLACE FUNCTION get_profile_by_email(e text)
RETURNS TABLE(profile_id uuid, role text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT p.id, p.role::text
  FROM auth.users u
  JOIN public.profiles p ON p.id = u.id
  WHERE LOWER(u.email) = LOWER(e)
  LIMIT 1;
$$;

COMMENT ON FUNCTION get_profile_by_email(text) IS 'Returns profile id and role for a given email (Hub signup step1)';

-- =========================================================
-- RLS
-- =========================================================
-- RLS: aucun accès via anon key. L'API utilise createAdminClient() (bypass RLS).
ALTER TABLE hub_signup_sessions ENABLE ROW LEVEL SECURITY;
-- Aucune policy permissive : seuls les appels avec service_role peuvent accéder à la table.
