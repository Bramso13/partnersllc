-- =========================================================
-- WORKFLOW TEMPLATES
-- Story 4.15: Templates de workflow produit – Sauvegarder et appliquer
-- =========================================================
-- Templates stockent une configuration workflow réutilisable
-- (steps, ordre, options, document_type_ids, custom_fields par step).
-- Admin uniquement : lecture et écriture.
-- =========================================================

-- =========================================================
-- TABLE: workflow_templates
-- =========================================================
CREATE TABLE workflow_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity
  name text NOT NULL UNIQUE,

  -- Workflow configuration (same structure as POST /api/admin/products/[id]/workflow)
  -- Each step: step_id, position, is_required, estimated_duration_hours,
  -- dossier_status_on_approval, document_type_ids, custom_fields
  steps jsonb NOT NULL DEFAULT '[]'::jsonb,

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT steps_is_array CHECK (jsonb_typeof(steps) = 'array')
);

COMMENT ON TABLE workflow_templates IS 'Named workflow configurations reusable across products';
COMMENT ON COLUMN workflow_templates.name IS 'Unique template name (e.g. LLC Standard, Parcours Banking)';
COMMENT ON COLUMN workflow_templates.steps IS 'Array of step configs: step_id, position, is_required, estimated_duration_hours, dossier_status_on_approval, document_type_ids, custom_fields';

-- Index for listing by name
CREATE INDEX idx_workflow_templates_name ON workflow_templates(name);

-- Index for created_at (listing order)
CREATE INDEX idx_workflow_templates_created_at ON workflow_templates(created_at DESC);

-- =========================================================
-- RLS POLICIES
-- =========================================================
ALTER TABLE workflow_templates ENABLE ROW LEVEL SECURITY;

-- Admin: full access (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "workflow_templates_admin_all"
  ON workflow_templates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'ADMIN'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'ADMIN'
    )
  );
