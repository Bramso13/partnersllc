-- ROLLBACK: 050_hub_member_profiles_add_city
ALTER TABLE hub_member_profiles DROP COLUMN IF EXISTS city;
