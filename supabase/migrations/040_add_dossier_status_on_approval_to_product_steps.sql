-- Story 4.14: Statut dossier configurable à la validation d'une step
-- Add optional dossier_status_on_approval to product_steps
-- When a step is approved, if this is set, the dossier status is updated automatically

ALTER TABLE product_steps
ADD COLUMN IF NOT EXISTS dossier_status_on_approval text;

COMMENT ON COLUMN product_steps.dossier_status_on_approval IS 'Optional dossier status to apply when this step is approved. NULL means no status change.';
