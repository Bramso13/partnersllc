-- ROLLBACK: 046_create_hub_signup_sessions
DROP TRIGGER IF EXISTS set_hub_signup_sessions_updated_at ON hub_signup_sessions;
DROP TABLE IF EXISTS hub_signup_sessions;
