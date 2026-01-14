-- =========================================================
-- ADD CASCADE DELETE TO PAYMENT_LINKS PRODUCT_ID FOREIGN KEY
-- =========================================================
-- This migration changes the foreign key constraint on payment_links.product_id
-- from ON DELETE RESTRICT to ON DELETE CASCADE
-- This allows products to be deleted even if they have associated payment links
-- =========================================================

-- Drop the existing foreign key constraint
ALTER TABLE payment_links
DROP CONSTRAINT IF EXISTS payment_links_product_id_fkey;

-- Recreate the foreign key constraint with ON DELETE CASCADE
ALTER TABLE payment_links
ADD CONSTRAINT payment_links_product_id_fkey
FOREIGN KEY (product_id)
REFERENCES products(id)
ON DELETE CASCADE;

-- Comment
COMMENT ON CONSTRAINT payment_links_product_id_fkey ON payment_links IS 
'Foreign key to products table. When a product is deleted, associated payment links are automatically deleted (CASCADE).';
