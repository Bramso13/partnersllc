-- 033_dossier_agent_assignments.sql
-- Story 8.3: Assignation des dossiers aux agents
--
-- This migration creates the dossier_agent_assignments table for explicit
-- dossier-to-agent assignment by type (VERIFICATEUR | CREATEUR).
-- This provides clear visibility control ("mes dossiers") separate from
-- step-level assignment (step_instances.assigned_to).

-- =========================================================
-- CREATE TABLE: dossier_agent_assignments
-- =========================================================

CREATE TABLE dossier_agent_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dossier_id uuid NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  assignment_type agent_type NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),

  -- Ensure only one agent per type per dossier
  CONSTRAINT uq_dossier_agent_assignments_dossier_type
    UNIQUE (dossier_id, assignment_type)
);

COMMENT ON TABLE dossier_agent_assignments IS
  'Assignation explicite dossier ↔ agent par type (VERIFICATEUR|CREATEUR). '
  'Contrôle la visibilité "mes dossiers" pour les agents. '
  'Distinct de step_instances.assigned_to qui détermine qui fait le travail sur chaque step.';

COMMENT ON COLUMN dossier_agent_assignments.dossier_id IS
  'Référence au dossier assigné';

COMMENT ON COLUMN dossier_agent_assignments.agent_id IS
  'Référence à l''agent assigné (doit correspondre à assignment_type)';

COMMENT ON COLUMN dossier_agent_assignments.assignment_type IS
  'Type d''assignation (VERIFICATEUR ou CREATEUR). Doit correspondre à agents.agent_type.';

COMMENT ON COLUMN dossier_agent_assignments.created_at IS
  'Date de création de l''assignation';

-- =========================================================
-- CREATE INDEXES
-- =========================================================

CREATE INDEX idx_dossier_agent_assignments_dossier_id
  ON dossier_agent_assignments(dossier_id);

CREATE INDEX idx_dossier_agent_assignments_agent_id
  ON dossier_agent_assignments(agent_id);

COMMENT ON INDEX idx_dossier_agent_assignments_dossier_id IS
  'Index pour rechercher toutes les assignations d''un dossier';

COMMENT ON INDEX idx_dossier_agent_assignments_agent_id IS
  'Index pour rechercher tous les dossiers d''un agent (requête "mes dossiers")';

-- =========================================================
-- MIGRATE EXISTING DATA
-- =========================================================
-- Migrate existing assignments from step_instances.assigned_to
-- For each (dossier_id, agent_id) pair where agent is assigned to at least one step,
-- create a dossier_agent_assignment with the agent's type.
-- If multiple agents of the same type exist for a dossier (edge case),
-- keep only the one with the most recent step_instance.

WITH agent_dossier_assignments AS (
  SELECT DISTINCT ON (si.dossier_id, a.agent_type)
    si.dossier_id,
    a.id AS agent_id,
    a.agent_type,
    si.created_at
  FROM step_instances si
  INNER JOIN agents a ON si.assigned_to = a.id
  WHERE si.assigned_to IS NOT NULL
  ORDER BY si.dossier_id, a.agent_type, si.created_at DESC
)
INSERT INTO dossier_agent_assignments (dossier_id, agent_id, assignment_type)
SELECT
  dossier_id,
  agent_id,
  agent_type
FROM agent_dossier_assignments
ON CONFLICT (dossier_id, assignment_type) DO NOTHING;

-- =========================================================
-- ROW LEVEL SECURITY (RLS)
-- =========================================================
-- Note: RLS is not enabled for this table as the application uses
-- the admin client (service role) which bypasses RLS for all operations.
-- This is consistent with the security model where authentication and
-- authorization are handled at the application layer rather than the database layer.
--
-- If RLS is needed in the future, uncomment the following policies:
--
-- ALTER TABLE dossier_agent_assignments ENABLE ROW LEVEL SECURITY;
--
-- CREATE POLICY "Service role has full access"
--   ON dossier_agent_assignments
--   FOR ALL
--   TO service_role
--   USING (true)
--   WITH CHECK (true);
--
-- For application-level RLS (not currently used):
-- CREATE POLICY "Admins have full access"
--   ON dossier_agent_assignments
--   FOR ALL
--   TO authenticated
--   USING (
--     EXISTS (
--       SELECT 1 FROM profiles
--       WHERE profiles.id = auth.uid()
--       AND profiles.role = 'ADMIN'
--     )
--   );

COMMENT ON TABLE dossier_agent_assignments IS
  'Assignation explicite dossier ↔ agent par type (VERIFICATEUR|CREATEUR). '
  'Contrôle la visibilité "mes dossiers" pour les agents. '
  'Distinct de step_instances.assigned_to qui détermine qui fait le travail sur chaque step. '
  'RLS not enabled - access control handled at application layer via admin client.';

-- =========================================================
-- ROLLBACK INSTRUCTIONS
-- =========================================================
-- To rollback this migration:
-- DROP TABLE IF EXISTS dossier_agent_assignments CASCADE;
