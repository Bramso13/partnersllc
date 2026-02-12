-- =========================================================
-- ROLLBACK: 046_hub_signup_sessions (Story 14.5)
-- =========================================================
-- Exécuter manuellement en cas de rollback.
-- =========================================================

DROP TABLE IF EXISTS hub_signup_sessions;
DROP FUNCTION IF EXISTS get_profile_by_email(text);
