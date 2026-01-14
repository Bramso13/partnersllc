-- =========================================================
-- ADD SET NULL DELETE TO ORDERS PRODUCT_ID FOREIGN KEY
-- =========================================================
-- This migration changes the foreign key constraint on orders.product_id
-- from ON DELETE RESTRICT to ON DELETE SET NULL
-- This allows products to be deleted while keeping the order records
-- with product_id set to NULL
-- =========================================================

-- First, make product_id nullable (required for SET NULL)
ALTER TABLE orders
ALTER COLUMN product_id DROP NOT NULL;

-- Drop the existing foreign key constraint
ALTER TABLE orders
DROP CONSTRAINT IF EXISTS orders_product_id_fkey;

-- Recreate the foreign key constraint with ON DELETE SET NULL
ALTER TABLE orders
ADD CONSTRAINT orders_product_id_fkey
FOREIGN KEY (product_id)
REFERENCES products(id)
ON DELETE SET NULL;

-- Comment
COMMENT ON CONSTRAINT orders_product_id_fkey ON orders IS 
'Foreign key to products table. When a product is deleted, the product_id is set to NULL (SET NULL) to preserve order history.';
