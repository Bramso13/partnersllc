-- Migration: 013_fix_dossier_notes_for_role_system.sql
-- Description: Update dossier_notes table to use profiles instead of agents table
-- Author: Dev Agent
-- Date: 2026-01-12

-- =========================================================
-- UPDATE TABLE STRUCTURE
-- =========================================================

-- Drop the old foreign key constraint to agents table
ALTER TABLE dossier_notes 
  DROP CONSTRAINT IF EXISTS dossier_notes_agent_id_fkey;

-- Rename agent_id to user_id for clarity (since it now references profiles)
ALTER TABLE dossier_notes 
  RENAME COLUMN agent_id TO user_id;

-- Add new foreign key constraint to profiles table
ALTER TABLE dossier_notes 
  ADD CONSTRAINT dossier_notes_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES profiles(id) 
  ON DELETE RESTRICT;

-- Update index name to match new column
DROP INDEX IF EXISTS idx_dossier_notes_agent_id;
CREATE INDEX idx_dossier_notes_user_id ON dossier_notes(user_id);

-- =========================================================
-- UPDATE RLS POLICIES
-- =========================================================

-- Drop old policies that reference agents table
DROP POLICY IF EXISTS "Agents can view all dossier notes" ON dossier_notes;
DROP POLICY IF EXISTS "Agents can create dossier notes" ON dossier_notes;
DROP POLICY IF EXISTS "Agents can update their own notes" ON dossier_notes;
DROP POLICY IF EXISTS "Agents can delete their own notes" ON dossier_notes;

-- Create new role-based policies

-- Admins have full access to all notes
CREATE POLICY "Admins have full access to dossier notes"
  ON dossier_notes
  FOR ALL
  USING (auth.role() = 'ADMIN')
  WITH CHECK (auth.role() = 'ADMIN');

-- Agents can view all notes
CREATE POLICY "Agents can view all dossier notes"
  ON dossier_notes
  FOR SELECT
  USING (auth.role() IN ('AGENT', 'ADMIN'));

-- Agents and admins can create notes (assigned to themselves)
CREATE POLICY "Agents and admins can create dossier notes"
  ON dossier_notes
  FOR INSERT
  WITH CHECK (
    auth.role() IN ('AGENT', 'ADMIN')
    AND user_id = auth.uid()
  );

-- Agents can update their own notes
CREATE POLICY "Users can update their own notes"
  ON dossier_notes
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Agents can delete their own notes
CREATE POLICY "Users can delete their own notes"
  ON dossier_notes
  FOR DELETE
  USING (user_id = auth.uid());

-- =========================================================
-- UPDATE COMMENTS
-- =========================================================

COMMENT ON TABLE dossier_notes IS 'Internal notes added by agents/admins to dossiers. Not visible to clients.';
COMMENT ON COLUMN dossier_notes.user_id IS 'The agent/admin user who created the note (references profiles.id)';

-- =========================================================
-- DATA MIGRATION (if needed)
-- =========================================================

-- Note: If there is existing data in dossier_notes with agent_id values,
-- this migration assumes those agent_id values are already valid user IDs
-- from the profiles table (since agents were migrated to profiles in migration 009).
-- No data transformation needed if the migration was done correctly.
