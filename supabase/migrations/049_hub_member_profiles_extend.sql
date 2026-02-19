-- =========================================================
-- PARTNERS HUB: Extension hub_member_profiles (Story 16.1)
-- =========================================================
-- Adds columns: avatar_url, languages, expertise_tags, years_experience,
-- website, linkedin_url, twitter_handle; extends bio to 1000 chars.
-- Index GIN on expertise_tags. Constraints: years_experience >= 0, URLs.
-- RLS unchanged (member can only update own profile).
--
-- Rollback: supabase/rollbacks/049_hub_member_profiles_extend_down.sql
-- =========================================================

-- Bio étendu à 1000 caractères
ALTER TABLE hub_member_profiles
  ALTER COLUMN bio TYPE varchar(1000);

COMMENT ON COLUMN hub_member_profiles.bio IS 'Short bio, max 1000 characters';

-- Nouvelles colonnes (nullable pour rétrocompatibilité)
ALTER TABLE hub_member_profiles
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS languages jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS expertise_tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS years_experience integer,
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS linkedin_url text,
  ADD COLUMN IF NOT EXISTS twitter_handle text;

COMMENT ON COLUMN hub_member_profiles.avatar_url IS 'Public URL of profile avatar (e.g. Supabase Storage)';
COMMENT ON COLUMN hub_member_profiles.languages IS 'Array of {code, level} e.g. [{"code":"fr","level":"native"},{"code":"en","level":"fluent"}]';
COMMENT ON COLUMN hub_member_profiles.expertise_tags IS 'Tags describing areas of expertise';
COMMENT ON COLUMN hub_member_profiles.years_experience IS 'Years of professional experience';
COMMENT ON COLUMN hub_member_profiles.website IS 'Personal or company website URL';
COMMENT ON COLUMN hub_member_profiles.linkedin_url IS 'LinkedIn profile URL';
COMMENT ON COLUMN hub_member_profiles.twitter_handle IS 'Twitter/X handle (without @)';

-- Contrainte: années d'expérience >= 0
ALTER TABLE hub_member_profiles
  DROP CONSTRAINT IF EXISTS hub_member_profiles_years_experience_non_negative;

ALTER TABLE hub_member_profiles
  ADD CONSTRAINT hub_member_profiles_years_experience_non_negative
  CHECK (years_experience IS NULL OR years_experience >= 0);

-- Contraintes URLs valides (http ou https)
ALTER TABLE hub_member_profiles
  DROP CONSTRAINT IF EXISTS hub_member_profiles_website_valid_url;

ALTER TABLE hub_member_profiles
  ADD CONSTRAINT hub_member_profiles_website_valid_url
  CHECK (website IS NULL OR website ~ '^https?://[^\s]+$');

ALTER TABLE hub_member_profiles
  DROP CONSTRAINT IF EXISTS hub_member_profiles_linkedin_url_valid;

ALTER TABLE hub_member_profiles
  ADD CONSTRAINT hub_member_profiles_linkedin_url_valid
  CHECK (linkedin_url IS NULL OR linkedin_url ~ '^https?://[^\s]+$');

-- Index GIN pour recherche sur expertise_tags (Story 16.2)
CREATE INDEX IF NOT EXISTS idx_hub_member_profiles_expertise_tags
  ON hub_member_profiles USING GIN (expertise_tags);
