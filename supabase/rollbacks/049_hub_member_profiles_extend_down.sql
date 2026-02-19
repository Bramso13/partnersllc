-- =========================================================
-- ROLLBACK: 049_hub_member_profiles_extend (Story 16.1)
-- =========================================================
-- Exécuter manuellement en cas de rollback.
-- =========================================================

-- Index
DROP INDEX IF EXISTS idx_hub_member_profiles_expertise_tags;

-- Contraintes
ALTER TABLE hub_member_profiles
  DROP CONSTRAINT IF EXISTS hub_member_profiles_years_experience_non_negative,
  DROP CONSTRAINT IF EXISTS hub_member_profiles_website_valid_url,
  DROP CONSTRAINT IF EXISTS hub_member_profiles_linkedin_url_valid;

-- Colonnes
ALTER TABLE hub_member_profiles
  DROP COLUMN IF EXISTS avatar_url,
  DROP COLUMN IF EXISTS languages,
  DROP COLUMN IF EXISTS expertise_tags,
  DROP COLUMN IF EXISTS years_experience,
  DROP COLUMN IF EXISTS website,
  DROP COLUMN IF EXISTS linkedin_url,
  DROP COLUMN IF EXISTS twitter_handle;

-- Remettre bio à 300 caractères
ALTER TABLE hub_member_profiles
  ALTER COLUMN bio TYPE varchar(300);

COMMENT ON COLUMN hub_member_profiles.bio IS 'Short bio, max 300 characters';
