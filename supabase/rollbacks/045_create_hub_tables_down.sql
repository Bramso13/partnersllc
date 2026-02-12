-- =========================================================
-- ROLLBACK: 045_create_hub_tables (Story 14.4)
-- =========================================================
-- Exécuter manuellement en cas de rollback.
-- Ne pas exécuter via supabase migration (fichier hors migrations/).
-- Note: La valeur 'hub_member' dans user_role n'est pas supprimée
-- (suppression d'une valeur d'enum nécessiterait de recréer le type).
-- =========================================================

-- RLS policies
DROP POLICY IF EXISTS "Users can delete own member profile" ON hub_member_profiles;
DROP POLICY IF EXISTS "Users can update own member profile" ON hub_member_profiles;
DROP POLICY IF EXISTS "Users can insert own member profile" ON hub_member_profiles;
DROP POLICY IF EXISTS "Hub members can view all member profiles" ON hub_member_profiles;

DROP POLICY IF EXISTS "Users can update own subscription" ON hub_subscriptions;
DROP POLICY IF EXISTS "Users can insert own subscription" ON hub_subscriptions;
DROP POLICY IF EXISTS "Users can view own subscription" ON hub_subscriptions;

-- Function
DROP FUNCTION IF EXISTS is_hub_member(uuid);

-- Triggers
DROP TRIGGER IF EXISTS set_hub_member_profiles_updated_at ON hub_member_profiles;
DROP TRIGGER IF EXISTS set_hub_subscriptions_updated_at ON hub_subscriptions;

-- Tables
DROP TABLE IF EXISTS hub_member_profiles;
DROP TABLE IF EXISTS hub_subscriptions;

-- Enums (ordre: d'abord les types qui les utilisent sont supprimés ci-dessus)
DROP TYPE IF EXISTS hub_subscription_status;
DROP TYPE IF EXISTS hub_subscription_plan;
