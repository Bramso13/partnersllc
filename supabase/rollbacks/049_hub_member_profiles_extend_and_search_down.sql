-- Rollback 049: hub_member_profiles extend + search indexes

-- Indexes recherche (16.2)
DROP INDEX IF EXISTS idx_hub_member_profiles_bio_trgm;
DROP INDEX IF EXISTS idx_hub_member_profiles_display_name_trgm;
DROP INDEX IF EXISTS idx_hub_member_profiles_profession;
DROP INDEX IF EXISTS idx_hub_member_profiles_expertise_tags_gin;

-- Contrainte
ALTER TABLE hub_member_profiles
  DROP CONSTRAINT IF EXISTS chk_hub_member_profiles_years_experience;

-- Colonnes 16.1
ALTER TABLE hub_member_profiles
  DROP COLUMN IF EXISTS avatar_url,
  DROP COLUMN IF EXISTS languages,
  DROP COLUMN IF EXISTS expertise_tags,
  DROP COLUMN IF EXISTS years_experience,
  DROP COLUMN IF EXISTS website,
  DROP COLUMN IF EXISTS linkedin_url,
  DROP COLUMN IF EXISTS twitter_handle;

-- Bio revenir à 300
ALTER TABLE hub_member_profiles
  ALTER COLUMN bio TYPE varchar(300);

-- Note: pg_trgm n'est pas désactivé (extension partagée possiblement utilisée ailleurs)
