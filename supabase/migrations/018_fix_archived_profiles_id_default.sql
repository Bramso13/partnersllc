-- =========================================================
-- FIX ARCHIVED_USER_PROFILES ID DEFAULT
-- =========================================================
-- This migration fixes the id column in archived_user_profiles
-- to have a default value if it was created without one
-- =========================================================

-- Add DEFAULT gen_random_uuid() to id column if it doesn't have one
DO $$
BEGIN
  -- Check if the column exists and doesn't have a default
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'archived_user_profiles' 
    AND column_name = 'id'
    AND column_default IS NULL
  ) THEN
    ALTER TABLE archived_user_profiles
    ALTER COLUMN id SET DEFAULT gen_random_uuid();
  END IF;
END $$;

-- Comment
COMMENT ON COLUMN archived_user_profiles.id IS 
'Primary key with auto-generated UUID for archived profile records.';
