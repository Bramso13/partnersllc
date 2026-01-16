-- =========================================================
-- ARCHIVE PROFILES AND PRESERVE DOSSIERS ON USER DELETION
-- =========================================================
-- This migration:
-- 1. Creates a table to archive user profiles when they are deleted
-- 2. Changes dossiers.user_id from ON DELETE CASCADE to ON DELETE SET NULL
--    to preserve dossiers when a user is deleted
-- 3. Creates a trigger to archive profile data before deletion
-- =========================================================

-- =========================================================
-- 1. CREATE ARCHIVED USER PROFILES TABLE
-- =========================================================
-- This table stores a snapshot of user profile data when a user is deleted
-- This allows us to preserve historical data while allowing user deletion
CREATE TABLE IF NOT EXISTS archived_user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Original profile data (snapshot at deletion time)
  original_user_id uuid NOT NULL,  -- The auth.users.id that was deleted
  full_name text,
  phone text,
  status user_status,
  stripe_customer_id text,
  
  -- Metadata
  archived_at timestamptz DEFAULT now() NOT NULL,
  archived_reason text,  -- Optional: reason for deletion/archival
  
  -- Original timestamps
  original_created_at timestamptz,
  original_updated_at timestamptz
);

-- Index for lookups
CREATE INDEX idx_archived_user_profiles_original_user_id 
  ON archived_user_profiles(original_user_id);

CREATE INDEX idx_archived_user_profiles_archived_at 
  ON archived_user_profiles(archived_at DESC);

-- Comment
COMMENT ON TABLE archived_user_profiles IS 
'Archived user profiles. Stores a snapshot of profile data when a user is deleted to preserve historical records.';

-- =========================================================
-- 2. CHANGE DOSSIERS.USER_ID TO SET NULL ON DELETE
-- =========================================================
-- This preserves dossiers when a user is deleted
-- The dossier will remain but user_id will be NULL

-- First, make user_id nullable (required for SET NULL)
ALTER TABLE dossiers
ALTER COLUMN user_id DROP NOT NULL;

-- Drop the existing foreign key constraint
ALTER TABLE dossiers
DROP CONSTRAINT IF EXISTS dossiers_user_id_fkey;

-- Recreate the foreign key constraint with ON DELETE SET NULL
ALTER TABLE dossiers
ADD CONSTRAINT dossiers_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES profiles(id)
ON DELETE SET NULL;

-- Comment
COMMENT ON CONSTRAINT dossiers_user_id_fkey ON dossiers IS 
'Foreign key to profiles table. When a profile is deleted, the user_id is set to NULL (SET NULL) to preserve dossier history.';

-- =========================================================
-- 3. CREATE TRIGGER TO ARCHIVE PROFILE BEFORE DELETION
-- =========================================================
-- This trigger runs BEFORE DELETE on profiles
-- It creates a snapshot in archived_user_profiles

CREATE OR REPLACE FUNCTION archive_user_profile_before_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a snapshot of the profile into archived_user_profiles
  INSERT INTO archived_user_profiles (
    id,
    original_user_id,
    full_name,
    phone,
    status,
    stripe_customer_id,
    original_created_at,
    original_updated_at,
    archived_at
  )
  VALUES (
    gen_random_uuid(),  -- New UUID for archived record
    OLD.id,             -- The auth.users.id being deleted
    OLD.full_name,
    OLD.phone,
    OLD.status,
    OLD.stripe_customer_id,
    OLD.created_at,
    OLD.updated_at,
    now()
  );
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS archive_profile_on_delete ON profiles;
CREATE TRIGGER archive_profile_on_delete
  BEFORE DELETE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION archive_user_profile_before_delete();

-- Comment
COMMENT ON FUNCTION archive_user_profile_before_delete() IS 
'Archives user profile data before deletion to preserve historical records.';

-- =========================================================
-- 4. VERIFY DOSSIER CASCADE DELETES ARE CORRECT
-- =========================================================
-- When a dossier is deleted, we want to cascade delete:
-- - step_instances (already has ON DELETE CASCADE)
-- - dossier_status_history (already has ON DELETE CASCADE)
-- - documents (already has ON DELETE CASCADE)
-- - messages (already has ON DELETE CASCADE)
-- - notifications (already has ON DELETE CASCADE)
-- - step_field_values (via step_instances cascade)
-- - document_versions (via documents cascade)
-- - document_reviews (via document_versions cascade)
--
-- We do NOT want to delete:
-- - steps (templates) - already has ON DELETE RESTRICT
-- - document_types (templates) - already has ON DELETE RESTRICT
-- - step_fields (templates) - already has ON DELETE RESTRICT
--
-- These are already correctly configured in the schema, so no changes needed.

-- =========================================================
-- 5. ADD HELPER FUNCTION TO GET ARCHIVED USER INFO
-- =========================================================
-- This function helps retrieve archived user information for a dossier
-- when the original user has been deleted

CREATE OR REPLACE FUNCTION get_dossier_user_info(p_dossier_id uuid)
RETURNS TABLE (
  user_id uuid,
  full_name text,
  phone text,
  is_archived boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(p.id, aup.original_user_id) as user_id,
    COALESCE(p.full_name, aup.full_name) as full_name,
    COALESCE(p.phone, aup.phone) as phone,
    (p.id IS NULL) as is_archived
  FROM dossiers d
  LEFT JOIN profiles p ON p.id = d.user_id
  LEFT JOIN archived_user_profiles aup ON aup.original_user_id = d.user_id
  WHERE d.id = p_dossier_id
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Comment
COMMENT ON FUNCTION get_dossier_user_info(uuid) IS 
'Returns user information for a dossier, including archived user data if the user has been deleted.';

-- =========================================================
-- 6. CREATE ARCHIVED USER DOSSIERS TABLE
-- =========================================================
-- This table stores compressed JSON snapshots of all dossiers
-- and their related data when a user is archived
CREATE TABLE IF NOT EXISTS archived_user_dossiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Reference to archived profile
  archived_profile_id uuid NOT NULL REFERENCES archived_user_profiles(id) ON DELETE CASCADE,
  
  -- Compressed dossier data (JSONB)
  -- Contains: dossiers, step_instances, step_field_values, documents, 
  -- document_versions, document_reviews, dossier_status_history, messages, notifications
  dossier_data jsonb NOT NULL,
  
  -- Metadata
  dossier_count int NOT NULL DEFAULT 0,  -- Number of dossiers archived
  archived_at timestamptz DEFAULT now() NOT NULL,
  archived_by uuid REFERENCES profiles(id) ON DELETE SET NULL,  -- Admin who archived
  archived_reason text  -- Optional: reason for archival
);

-- Index for lookups
CREATE INDEX idx_archived_user_dossiers_profile_id 
  ON archived_user_dossiers(archived_profile_id);

CREATE INDEX idx_archived_user_dossiers_archived_at 
  ON archived_user_dossiers(archived_at DESC);

-- Comment
COMMENT ON TABLE archived_user_dossiers IS 
'Archived user dossiers. Stores compressed JSON snapshots of all dossiers and their related data (steps, documents, messages, etc.) when a user is archived.';

-- =========================================================
-- 7. CREATE FUNCTION TO ARCHIVE USER DOSSIERS
-- =========================================================
-- This function collects all dossier data for a user and compresses it into JSON
CREATE OR REPLACE FUNCTION archive_user_dossiers(
  p_user_id uuid,
  p_archived_by uuid DEFAULT NULL,
  p_reason text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_archived_profile_id uuid;
  v_archived_dossiers_id uuid;
  v_dossier_data jsonb;
  v_dossier_count int;
BEGIN
  -- Find the archived profile record
  SELECT id INTO v_archived_profile_id
  FROM archived_user_profiles
  WHERE original_user_id = p_user_id
  ORDER BY archived_at DESC
  LIMIT 1;
  
  -- If no archived profile found, raise error
  IF v_archived_profile_id IS NULL THEN
    RAISE EXCEPTION 'No archived profile found for user_id: %', p_user_id;
  END IF;
  
  -- Collect all dossier data
  SELECT 
    jsonb_agg(
      jsonb_build_object(
        'dossier', row_to_json(d.*),
        'status_history', COALESCE((
          SELECT jsonb_agg(row_to_json(dsh.*))
          FROM dossier_status_history dsh
          WHERE dsh.dossier_id = d.id
        ), '[]'::jsonb),
        'step_instances', COALESCE((
          SELECT jsonb_agg(
            jsonb_build_object(
              'step_instance', row_to_json(si.*),
              'step_field_values', COALESCE((
                SELECT jsonb_agg(row_to_json(sfv.*))
                FROM step_field_values sfv
                WHERE sfv.step_instance_id = si.id
              ), '[]'::jsonb)
            )
          )
          FROM step_instances si
          WHERE si.dossier_id = d.id
        ), '[]'::jsonb),
        'documents', COALESCE((
          SELECT jsonb_agg(
            jsonb_build_object(
              'document', row_to_json(doc.*),
              'versions', COALESCE((
                SELECT jsonb_agg(
                  jsonb_build_object(
                    'version', row_to_json(dv.*),
                    'reviews', COALESCE((
                      SELECT jsonb_agg(row_to_json(dr.*))
                      FROM document_reviews dr
                      WHERE dr.document_version_id = dv.id
                    ), '[]'::jsonb)
                  )
                )
                FROM document_versions dv
                WHERE dv.document_id = doc.id
              ), '[]'::jsonb)
            )
          )
          FROM documents doc
          WHERE doc.dossier_id = d.id
        ), '[]'::jsonb),
        'messages', COALESCE((
          SELECT jsonb_agg(row_to_json(m.*))
          FROM messages m
          WHERE m.dossier_id = d.id
        ), '[]'::jsonb),
        'notifications', COALESCE((
          SELECT jsonb_agg(row_to_json(n.*))
          FROM notifications n
          WHERE n.dossier_id = d.id
        ), '[]'::jsonb)
      )
    ),
    COUNT(*)
  INTO v_dossier_data, v_dossier_count
  FROM dossiers d
  WHERE d.user_id = p_user_id;
  
  -- If no dossiers, set empty array
  IF v_dossier_data IS NULL THEN
    v_dossier_data := '[]'::jsonb;
    v_dossier_count := 0;
  END IF;
  
  -- Insert into archived_user_dossiers
  INSERT INTO archived_user_dossiers (
    archived_profile_id,
    dossier_data,
    dossier_count,
    archived_by,
    archived_reason
  )
  VALUES (
    v_archived_profile_id,
    v_dossier_data,
    v_dossier_count,
    p_archived_by,
    p_reason
  )
  RETURNING id INTO v_archived_dossiers_id;
  
  RETURN v_archived_dossiers_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment
COMMENT ON FUNCTION archive_user_dossiers(uuid, uuid, text) IS 
'Archives all dossiers and their related data for a user into compressed JSON. Returns the ID of the archived record.';
