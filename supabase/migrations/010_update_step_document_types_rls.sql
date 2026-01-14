 -- Drop old policies
  DROP POLICY IF EXISTS "Admins can manage step document types" ON step_document_types;
  DROP POLICY IF EXISTS "Authenticated users can view step document types" ON step_document_types;
  DROP POLICY IF EXISTS "Admins have full access to step document types" ON step_document_types;
  DROP POLICY IF EXISTS "Agents can manage step document types" ON step_document_types;
  DROP POLICY IF EXISTS "All users can view step document types" ON step_document_types;

  -- Create new policies with direct subqueries
  CREATE POLICY "Admins have full access to step document types"
    ON step_document_types
    FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role = 'ADMIN'
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role = 'ADMIN'
      )
    );

  CREATE POLICY "Agents can manage step document types"
    ON step_document_types
    FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role IN ('AGENT', 'ADMIN')
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role IN ('AGENT', 'ADMIN')
      )
    );

  CREATE POLICY "All users can view step document types"
    ON step_document_types
    FOR SELECT
    USING (true);