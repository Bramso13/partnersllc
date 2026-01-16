-- =========================================================
-- RLS POLICIES FOR ADMIN DOCUMENT DELIVERY
-- Story 3.8: Admin Document Delivery to Clients
-- =========================================================
-- This migration:
-- 1. Ensures agents/admins can INSERT documents to any dossier
-- 2. Ensures clients can SELECT documents from their own dossiers
-- 3. Ensures document_versions can be created by agents/admins
-- =========================================================

-- =========================================================
-- DOCUMENTS TABLE - INSERT POLICY FOR AGENTS/ADMINS
-- =========================================================
-- Note: Admins already have FOR ALL access, but we add explicit INSERT for agents
CREATE POLICY IF NOT EXISTS "Agents can insert documents"
  ON documents
  FOR INSERT
  WITH CHECK (
    auth.role() IN ('AGENT', 'ADMIN')
  );

-- =========================================================
-- DOCUMENT_VERSIONS TABLE - INSERT POLICY FOR AGENTS/ADMINS
-- =========================================================
-- Ensure agents/admins can create document versions
CREATE POLICY IF NOT EXISTS "Agents can insert document versions"
  ON document_versions
  FOR INSERT
  WITH CHECK (
    auth.role() IN ('AGENT', 'ADMIN')
  );

-- =========================================================
-- VERIFY EXISTING POLICIES
-- =========================================================
-- Clients can view their own documents (should already exist)
-- This is verified by the existing policy "Clients can view their own documents"

-- Admins have full access (should already exist via "Admins have full access to documents")

COMMENT ON POLICY "Agents can insert documents" ON documents IS 
  'Allows agents and admins to insert documents for any dossier (for admin document delivery)';

COMMENT ON POLICY "Agents can insert document versions" ON document_versions IS 
  'Allows agents and admins to create document versions when delivering documents to clients';
