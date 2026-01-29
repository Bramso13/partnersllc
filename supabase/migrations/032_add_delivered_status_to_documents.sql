-- Migration: Add DELIVERED status and delivered_at to documents table
-- Story: 11.2 - Agent Admin Document Upload in Dossier View
-- Purpose: Track when admin documents are delivered to clients

-- Add DELIVERED status to document_status enum
ALTER TYPE document_status ADD VALUE IF NOT EXISTS 'DELIVERED';

-- Add delivered_at column to documents table
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS delivered_at timestamptz;

-- Add comment
COMMENT ON COLUMN documents.delivered_at IS 'Timestamp when document was delivered to client (for ADMIN documents)';

-- Create unique constraint for upsert operation
-- This allows one document per (dossier, document_type, step_instance)
-- NULL step_instance_id means admin-delivered document (not tied to specific step)

-- First, delete duplicates (keep only the most recent one)
WITH duplicates AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY dossier_id, document_type_id, step_instance_id 
           ORDER BY created_at DESC
         ) as rn
  FROM documents
  WHERE step_instance_id IS NOT NULL
)
DELETE FROM documents
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Now add the unique constraint
ALTER TABLE documents 
DROP CONSTRAINT IF EXISTS documents_dossier_document_type_step_unique;

ALTER TABLE documents 
ADD CONSTRAINT documents_dossier_document_type_step_unique 
UNIQUE (dossier_id, document_type_id, step_instance_id);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_documents_delivered_at 
ON documents(delivered_at) 
WHERE delivered_at IS NOT NULL;
