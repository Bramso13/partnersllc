-- =========================================================
-- PARTNERS HUB: Add city to hub_member_profiles
-- =========================================================

ALTER TABLE hub_member_profiles
  ADD COLUMN IF NOT EXISTS city text;

COMMENT ON COLUMN hub_member_profiles.city IS 'Ville du membre (ex: Paris, Lyon)';
