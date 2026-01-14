-- Migration: 009_update_rls_policies_for_roles.sql
-- Description: Update RLS policies to use profiles.role instead of agents table
-- Author: Dev Agent (James)
-- Date: 2026-01-11

-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION auth.role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Drop existing agent-based policies if they exist
-- We'll recreate them with the new role-based logic

-- DOSSIERS TABLE
-- Drop old policies
DROP POLICY IF EXISTS "Agents can view all dossiers" ON dossiers;
DROP POLICY IF EXISTS "Agents can update dossiers" ON dossiers;
DROP POLICY IF EXISTS "Users can view their own dossiers" ON dossiers;
DROP POLICY IF EXISTS "Users can create dossiers" ON dossiers;

-- Create new role-based policies
CREATE POLICY "Admins have full access to dossiers"
  ON dossiers
  FOR ALL
  USING (auth.role() = 'ADMIN')
  WITH CHECK (auth.role() = 'ADMIN');

CREATE POLICY "Agents can view all dossiers"
  ON dossiers
  FOR SELECT
  USING (auth.role() IN ('AGENT', 'ADMIN'));

CREATE POLICY "Agents can update dossiers"
  ON dossiers
  FOR UPDATE
  USING (auth.role() IN ('AGENT', 'ADMIN'))
  WITH CHECK (auth.role() IN ('AGENT', 'ADMIN'));

CREATE POLICY "Clients can view their own dossiers"
  ON dossiers
  FOR SELECT
  USING (auth.role() = 'CLIENT' AND user_id = auth.uid());

CREATE POLICY "Clients can create dossiers"
  ON dossiers
  FOR INSERT
  WITH CHECK (auth.role() = 'CLIENT' AND user_id = auth.uid());

-- DOCUMENTS TABLE
DROP POLICY IF EXISTS "Agents can view all documents" ON documents;
DROP POLICY IF EXISTS "Users can view their dossier documents" ON documents;
DROP POLICY IF EXISTS "Users can upload documents" ON documents;

CREATE POLICY "Admins have full access to documents"
  ON documents
  FOR ALL
  USING (auth.role() = 'ADMIN')
  WITH CHECK (auth.role() = 'ADMIN');

CREATE POLICY "Agents can view all documents"
  ON documents
  FOR SELECT
  USING (auth.role() IN ('AGENT', 'ADMIN'));

CREATE POLICY "Agents can update documents"
  ON documents
  FOR UPDATE
  USING (auth.role() IN ('AGENT', 'ADMIN'))
  WITH CHECK (auth.role() IN ('AGENT', 'ADMIN'));

CREATE POLICY "Clients can view their own documents"
  ON documents
  FOR SELECT
  USING (
    auth.role() = 'CLIENT' AND
    dossier_id IN (SELECT id FROM dossiers WHERE user_id = auth.uid())
  );

CREATE POLICY "Clients can upload documents"
  ON documents
  FOR INSERT
  WITH CHECK (
    auth.role() = 'CLIENT' AND
    dossier_id IN (SELECT id FROM dossiers WHERE user_id = auth.uid())
  );

-- STEP_INSTANCES TABLE
DROP POLICY IF EXISTS "Agents can view all step instances" ON step_instances;
DROP POLICY IF EXISTS "Users can view their step instances" ON step_instances;
DROP POLICY IF EXISTS "Users can update their step instances" ON step_instances;

CREATE POLICY "Admins have full access to step instances"
  ON step_instances
  FOR ALL
  USING (auth.role() = 'ADMIN')
  WITH CHECK (auth.role() = 'ADMIN');

CREATE POLICY "Agents can view all step instances"
  ON step_instances
  FOR SELECT
  USING (auth.role() IN ('AGENT', 'ADMIN'));

CREATE POLICY "Agents can update step instances"
  ON step_instances
  FOR UPDATE
  USING (auth.role() IN ('AGENT', 'ADMIN'))
  WITH CHECK (auth.role() IN ('AGENT', 'ADMIN'));

CREATE POLICY "Clients can view their own step instances"
  ON step_instances
  FOR SELECT
  USING (
    auth.role() = 'CLIENT' AND
    dossier_id IN (SELECT id FROM dossiers WHERE user_id = auth.uid())
  );

CREATE POLICY "Clients can update their own step instances"
  ON step_instances
  FOR UPDATE
  USING (
    auth.role() = 'CLIENT' AND
    dossier_id IN (SELECT id FROM dossiers WHERE user_id = auth.uid())
  )
  WITH CHECK (
    auth.role() = 'CLIENT' AND
    dossier_id IN (SELECT id FROM dossiers WHERE user_id = auth.uid())
  );

-- PROFILES TABLE
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

CREATE POLICY "Admins can view all profiles"
  ON profiles
  FOR SELECT
  USING (auth.role() = 'ADMIN');

CREATE POLICY "Agents can view all profiles"
  ON profiles
  FOR SELECT
  USING (auth.role() IN ('AGENT', 'ADMIN'));

CREATE POLICY "Users can view their own profile"
  ON profiles
  FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Only admins can change roles (security measure)
CREATE POLICY "Only admins can update user roles"
  ON profiles
  FOR UPDATE
  USING (auth.role() = 'ADMIN')
  WITH CHECK (auth.role() = 'ADMIN');

-- DOSSIER_NOTES TABLE (if exists)
DROP POLICY IF EXISTS "Agents can manage dossier notes" ON dossier_notes;

CREATE POLICY "Admins have full access to dossier notes"
  ON dossier_notes
  FOR ALL
  USING (auth.role() = 'ADMIN')
  WITH CHECK (auth.role() = 'ADMIN');

CREATE POLICY "Agents can manage dossier notes"
  ON dossier_notes
  FOR ALL
  USING (auth.role() IN ('AGENT', 'ADMIN'))
  WITH CHECK (auth.role() IN ('AGENT', 'ADMIN'));

-- PAYMENT_LINKS TABLE (admin only)
DROP POLICY IF EXISTS "Admins can manage payment links" ON payment_links;

CREATE POLICY "Admins can manage payment links"
  ON payment_links
  FOR ALL
  USING (auth.role() = 'ADMIN')
  WITH CHECK (auth.role() = 'ADMIN');

-- PRODUCTS TABLE (read for all authenticated, write for admins)
DROP POLICY IF EXISTS "Anyone can view products" ON products;
DROP POLICY IF EXISTS "Admins can manage products" ON products;

CREATE POLICY "Authenticated users can view products"
  ON products
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage products"
  ON products
  FOR ALL
  USING (auth.role() = 'ADMIN')
  WITH CHECK (auth.role() = 'ADMIN');

-- Add comments for documentation
COMMENT ON FUNCTION auth.role() IS 'Returns the role of the currently authenticated user from profiles table';
