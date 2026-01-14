-- Migration: 014_add_clients_update_documents_policy.sql
-- Description: Add UPDATE policy for clients to update their own documents (needed for current_version_id updates)
-- Date: 2026-01-XX

-- Allow clients to update their own documents
-- This is needed so clients can update current_version_id when uploading new versions
CREATE POLICY "Clients can update their own documents"
  ON documents
  FOR UPDATE
  USING (
    auth.role() = 'CLIENT' AND
    dossier_id IN (SELECT id FROM dossiers WHERE user_id = auth.uid())
  )
  WITH CHECK (
    auth.role() = 'CLIENT' AND
    dossier_id IN (SELECT id FROM dossiers WHERE user_id = auth.uid())
  );
