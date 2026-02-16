-- 048_agent_double_role_dossier_assignments.sql
-- Story 8.5: Agent Vérificateur et Créateur - Double rôle
-- Permet à un agent d'avoir les deux rôles (VERIFICATEUR + CREATEUR) sur un même dossier.

-- =========================================================
-- 1. Ajouter la valeur VERIFICATEUR_ET_CREATEUR à l'enum agent_type
-- =========================================================
ALTER TYPE agent_type ADD VALUE IF NOT EXISTS 'VERIFICATEUR_ET_CREATEUR';

COMMENT ON TYPE agent_type IS
  'Type d''agent: VERIFICATEUR (review docs clients), CREATEUR (upload docs admin), ou VERIFICATEUR_ET_CREATEUR (les deux).';

-- =========================================================
-- 2. Remplacer la contrainte unique sur dossier_agent_assignments
-- Ancienne: UNIQUE (dossier_id, assignment_type) -> un agent par type par dossier.
-- Nouvelle: UNIQUE (dossier_id, agent_id, assignment_type) -> même agent peut avoir VERIF et CREATEUR sur un dossier.
-- On conserve la règle métier "un seul agent par type par dossier" dans l'API (delete + insert).
-- =========================================================
ALTER TABLE dossier_agent_assignments
  DROP CONSTRAINT IF EXISTS uq_dossier_agent_assignments_dossier_type;

ALTER TABLE dossier_agent_assignments
  ADD CONSTRAINT uq_dossier_agent_assignments_dossier_agent_type
  UNIQUE (dossier_id, agent_id, assignment_type);

COMMENT ON CONSTRAINT uq_dossier_agent_assignments_dossier_agent_type ON dossier_agent_assignments IS
  'Un agent peut avoir au plus une ligne par (dossier, type). Même agent peut avoir VERIFICATEUR et CREATEUR sur un dossier.';
