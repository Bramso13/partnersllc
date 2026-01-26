-- =========================================================
-- REFACTOR: step_document_types - product_step_id → step_id
-- =========================================================
-- Simplifie la gestion des document types en les liant
-- directement aux steps plutôt qu'aux product_steps.
-- Tous les produits utilisant le même step partagent
-- les mêmes document types requis.
-- =========================================================

BEGIN;

-- Étape 1: Ajouter colonne step_id (nullable temporairement)
ALTER TABLE step_document_types
ADD COLUMN step_id uuid;

-- Étape 2: Popule step_id depuis product_steps
UPDATE step_document_types sdt
SET step_id = ps.step_id
FROM product_steps ps
WHERE sdt.product_step_id = ps.id;

-- Étape 3: Vérifier que toutes les lignes ont un step_id
-- (devrait être 100% si données cohérentes)
DO $$
DECLARE
  null_count integer;
BEGIN
  SELECT COUNT(*) INTO null_count
  FROM step_document_types
  WHERE step_id IS NULL;

  IF null_count > 0 THEN
    RAISE EXCEPTION 'Migration failed: % rows have NULL step_id', null_count;
  END IF;
END $$;

-- Étape 4: Supprimer doublons (même step_id + document_type_id)
-- On garde la ligne la plus récente
DELETE FROM step_document_types sdt1
WHERE sdt1.id IN (
  SELECT sdt2.id
  FROM step_document_types sdt2
  INNER JOIN (
    SELECT step_id, document_type_id, MAX(created_at) as max_created
    FROM step_document_types
    GROUP BY step_id, document_type_id
    HAVING COUNT(*) > 1
  ) duplicates
  ON sdt2.step_id = duplicates.step_id
  AND sdt2.document_type_id = duplicates.document_type_id
  AND sdt2.created_at < duplicates.max_created
);

-- Étape 5: Supprimer ancien index
DROP INDEX IF EXISTS idx_step_document_types_product_step;

-- Étape 6: Supprimer ancienne contrainte unique
ALTER TABLE step_document_types
DROP CONSTRAINT IF EXISTS step_document_types_product_step_id_document_type_id_key;

-- Étape 7: Supprimer colonne product_step_id
ALTER TABLE step_document_types
DROP COLUMN product_step_id;

-- Étape 8: Rendre step_id NOT NULL
ALTER TABLE step_document_types
ALTER COLUMN step_id SET NOT NULL;

-- Étape 9: Ajouter foreign key
ALTER TABLE step_document_types
ADD CONSTRAINT fk_step_document_types_step_id
FOREIGN KEY (step_id)
REFERENCES steps(id)
ON DELETE CASCADE;

-- Étape 10: Ajouter nouvelle contrainte unique
ALTER TABLE step_document_types
ADD CONSTRAINT step_document_types_step_id_document_type_id_key
UNIQUE (step_id, document_type_id);

-- Étape 11: Créer nouvel index pour performance
CREATE INDEX idx_step_document_types_step_id
ON step_document_types(step_id);

-- Étape 12: Conserver index document_type_id (existe déjà)
-- (idx_step_document_types_document_type existe déjà, on le garde)

COMMIT;

-- =========================================================
-- Vérification post-migration
-- =========================================================
DO $$
DECLARE
  total_count integer;
  step_count integer;
BEGIN
  SELECT COUNT(*) INTO total_count FROM step_document_types;
  SELECT COUNT(DISTINCT step_id) INTO step_count FROM step_document_types;

  RAISE NOTICE 'Migration completed successfully!';
  RAISE NOTICE 'Total step_document_types: %', total_count;
  RAISE NOTICE 'Unique steps with documents: %', step_count;
END $$;
