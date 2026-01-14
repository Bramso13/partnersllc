-- Migration: 012_fix_events_rls_policies.sql
-- Description: Fix RLS policies for events table and update trigger functions
-- Author: Dev Agent
-- Date: 2026-01-12

-- =========================================================
-- EVENTS TABLE RLS POLICIES
-- =========================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view dossier events" ON events;
DROP POLICY IF EXISTS "Agents can view all events" ON events;

-- Create comprehensive RLS policies for events table
CREATE POLICY "Admins have full access to events"
  ON events
  FOR ALL
  USING (auth.role() = 'ADMIN')
  WITH CHECK (auth.role() = 'ADMIN');

CREATE POLICY "Agents can view all events"
  ON events
  FOR SELECT
  USING (auth.role() IN ('AGENT', 'ADMIN'));

CREATE POLICY "Clients can view events for their dossiers"
  ON events
  FOR SELECT
  USING (
    auth.role() = 'CLIENT' AND
    (
      -- Events for dossiers owned by the user
      (entity_type = 'dossier' AND entity_id::uuid IN (
        SELECT id FROM dossiers WHERE user_id = auth.uid()
      ))
      OR
      -- Events for documents in dossiers owned by the user
      (entity_type = 'document' AND entity_id::uuid IN (
        SELECT d.id FROM documents d
        INNER JOIN dossiers dos ON d.dossier_id = dos.id
        WHERE dos.user_id = auth.uid()
      ))
    )
  );

-- =========================================================
-- UPDATE TRIGGER FUNCTIONS TO USE SECURITY DEFINER
-- =========================================================

-- Recreate the dossier status event function with SECURITY DEFINER
-- This allows the trigger to bypass RLS when inserting events
CREATE OR REPLACE FUNCTION create_dossier_status_event()
RETURNS TRIGGER
SECURITY DEFINER -- This is the key addition
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO events (entity_type, entity_id, event_type, payload)
    VALUES (
      'dossier',
      NEW.id,
      'DOSSIER_STATUS_CHANGED',
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status,
        'dossier_type', NEW.type
      )
    );

    -- Also insert into status history
    INSERT INTO dossier_status_history (dossier_id, old_status, new_status)
    VALUES (NEW.id, OLD.status, NEW.status);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the document upload event function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION create_document_upload_event()
RETURNS TRIGGER
SECURITY DEFINER -- This is the key addition
SET search_path = public
AS $$
DECLARE
  v_dossier_id UUID;
BEGIN
  SELECT dossier_id INTO v_dossier_id FROM documents WHERE id = NEW.document_id;

  INSERT INTO events (entity_type, entity_id, event_type, payload)
  VALUES (
    'document',
    NEW.document_id,
    'DOCUMENT_UPLOADED',
    jsonb_build_object(
      'version_id', NEW.id,
      'version_number', NEW.version_number,
      'file_name', NEW.file_name,
      'dossier_id', v_dossier_id,
      'uploaded_by_type', NEW.uploaded_by_type,
      'uploaded_by_id', NEW.uploaded_by_id
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON FUNCTION create_dossier_status_event() IS 'Trigger function to create event when dossier status changes. Uses SECURITY DEFINER to bypass RLS.';
COMMENT ON FUNCTION create_document_upload_event() IS 'Trigger function to create event when document version is uploaded. Uses SECURITY DEFINER to bypass RLS.';
COMMENT ON POLICY "Admins have full access to events" ON events IS 'Admins can view and manage all events';
COMMENT ON POLICY "Agents can view all events" ON events IS 'Agents can view all events for monitoring purposes';
COMMENT ON POLICY "Clients can view events for their dossiers" ON events IS 'Clients can only view events related to their own dossiers and documents';
