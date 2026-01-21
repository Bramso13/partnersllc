-- 027_add_product_deposit_fields.sql
-- Story 9.1: Dashboard Admin - Vue Globale des Revenus avec Gestion des Acomptes
-- Ajouter les champs pour gérer les produits acomptes

-- =========================================================
-- Ajouter colonne is_deposit
-- =========================================================
ALTER TABLE products
ADD COLUMN IF NOT EXISTS is_deposit boolean DEFAULT false NOT NULL;

-- =========================================================
-- Ajouter colonne full_product_id (FK vers products.id)
-- =========================================================
ALTER TABLE products
ADD COLUMN IF NOT EXISTS full_product_id uuid REFERENCES products(id);

-- =========================================================
-- Ajouter index sur full_product_id pour les performances
-- =========================================================
CREATE INDEX IF NOT EXISTS idx_products_full_product_id ON products(full_product_id);

-- =========================================================
-- Ajouter commentaires sur les colonnes
-- =========================================================
COMMENT ON COLUMN products.is_deposit IS 'Indique si ce produit est un acompte';
COMMENT ON COLUMN products.full_product_id IS 'Référence au produit complet si is_deposit = true';
