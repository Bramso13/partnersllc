-- Migration: 036_add_dossiers_products_is_test.sql
-- Description: Add is_test flag to dossiers and products for excluding test data from analytics
-- Story: 9.3 Dossier et produit test – analytics exclusion
-- RLS: Existing admin/agent policies on dossiers and admin policies on products already allow UPDATE.

-- Dossiers: mark as test (excluded from analytics)
ALTER TABLE dossiers
  ADD COLUMN IF NOT EXISTS is_test boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN dossiers.is_test IS 'When true, dossier is excluded from admin analytics metrics.';

-- Products: mark as test (excluded from analytics)
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS is_test boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN products.is_test IS 'When true, product and its orders/dossiers are excluded from product-level analytics.';
