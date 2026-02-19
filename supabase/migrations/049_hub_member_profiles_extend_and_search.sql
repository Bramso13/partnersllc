-- =========================================================
-- PARTNERS HUB: Extension profils (16.1) + indexation recherche (16.2)
-- =========================================================
-- Story 16.1: colonnes avatar_url, languages, expertise_tags, years_experience, website, linkedin_url, twitter_handle ; bio étendu à 1000.
-- Story 16.2: indexation pour recherche (GIN expertise_tags, profession, pg_trgm display_name/bio).
-- Rollback: voir supabase/rollbacks/049_hub_member_profiles_extend_and_search_down.sql
-- =========================================================

-- =========================================================
-- 1. Extension pg_trgm (recherche floue / full-text)
-- =========================================================
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =========================================================
-- 2. Extension hub_member_profiles (Story 16.1)
-- =========================================================

-- Bio étendu à 1000 caractères
ALTER TABLE hub_member_profiles
  ALTER COLUMN bio TYPE varchar(1000);

-- Nouvelles colonnes (nullable, backward compatible)
ALTER TABLE hub_member_profiles
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS languages jsonb,
  ADD COLUMN IF NOT EXISTS expertise_tags text[],
  ADD COLUMN IF NOT EXISTS years_experience integer,
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS linkedin_url text,
  ADD COLUMN IF NOT EXISTS twitter_handle text;

-- Contraintes
ALTER TABLE hub_member_profiles
  DROP CONSTRAINT IF EXISTS chk_hub_member_profiles_years_experience;
ALTER TABLE hub_member_profiles
  ADD CONSTRAINT chk_hub_member_profiles_years_experience
  CHECK (years_experience IS NULL OR years_experience >= 0);

COMMENT ON COLUMN hub_member_profiles.avatar_url IS 'URL publique avatar (Storage hub-avatars)';
COMMENT ON COLUMN hub_member_profiles.languages IS 'Langues parlées: [{code, level}, ...]';
COMMENT ON COLUMN hub_member_profiles.expertise_tags IS 'Tags expertise (recherche, filtres)';
COMMENT ON COLUMN hub_member_profiles.bio IS 'Bio courte, max 1000 caractères';

-- =========================================================
-- 3. Indexation recherche (Story 16.2) – objectif < 500 ms
-- =========================================================

-- GIN sur expertise_tags (filtre par tag, contains)
CREATE INDEX IF NOT EXISTS idx_hub_member_profiles_expertise_tags_gin
  ON hub_member_profiles USING GIN (expertise_tags);

-- Btree sur profession (filtre égalité)
CREATE INDEX IF NOT EXISTS idx_hub_member_profiles_profession
  ON hub_member_profiles (profession);

-- Trigram sur display_name et bio pour recherche texte (paramètre q)
CREATE INDEX IF NOT EXISTS idx_hub_member_profiles_display_name_trgm
  ON hub_member_profiles USING GIN (display_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_hub_member_profiles_bio_trgm
  ON hub_member_profiles USING GIN (bio gin_trgm_ops);
