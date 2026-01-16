-- =========================================================
-- ADD TERMS ACCEPTANCE FIELDS TO PROFILES TABLE
-- =========================================================
-- This migration:
-- 1. Adds terms_accepted boolean field (default: true)
-- 2. Adds terms_accepted_at timestamp field (default: 2026-01-16 17:42)
-- =========================================================

-- =========================================================
-- 1. ADD TERMS_ACCEPTED COLUMN
-- =========================================================
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS terms_accepted boolean NOT NULL DEFAULT true;

-- =========================================================
-- 2. ADD TERMS_ACCEPTED_AT COLUMN
-- =========================================================
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz DEFAULT '2026-01-16 17:42:00'::timestamptz;

-- =========================================================
-- 3. UPDATE EXISTING PROFILES
-- =========================================================
-- Set default values for all existing profiles
UPDATE profiles
SET 
  terms_accepted = true,
  terms_accepted_at = '2026-01-16 17:42:00'::timestamptz
WHERE terms_accepted IS NULL OR terms_accepted_at IS NULL;

-- =========================================================
-- 4. UPDATE handle_new_user() FUNCTION
-- =========================================================
-- Update the function to include terms_accepted fields when creating new profiles
-- Note: Since we have defaults, this is optional but ensures explicit handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    full_name, 
    status, 
    created_at, 
    updated_at,
    terms_accepted,
    terms_accepted_at
  )
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    'PENDING',
    NOW(),
    NOW(),
    true,
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================================================
-- COMMENTS
-- =========================================================
COMMENT ON COLUMN profiles.terms_accepted IS 
  'Indicates whether the user has accepted the terms and conditions. Defaults to true for existing users.';

COMMENT ON COLUMN profiles.terms_accepted_at IS 
  'Timestamp when the user accepted the terms and conditions. Defaults to 2026-01-16 17:42:00 for existing users, NOW() for new users.';
