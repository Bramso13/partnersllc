-- =========================================================
-- MIGRATION 004: Admin Validation System
-- =========================================================
-- Adds validation status for step_field_values and step_instances
-- Enables admin review workflow with rejection feedback
-- =========================================================

-- =========================================================
-- ENUMS
-- =========================================================

-- Validation status for individual field values
CREATE TYPE field_value_status AS ENUM (
  'PENDING',      -- Submitted by client, awaiting review
  'APPROVED',     -- Validated by admin
  'REJECTED'      -- Rejected by admin, needs correction
);

-- Validation status for step instances
CREATE TYPE step_validation_status AS ENUM (
  'DRAFT',          -- Client is still filling fields (not submitted)
  'SUBMITTED',      -- Client submitted, awaiting admin review
  'UNDER_REVIEW',   -- Admin is reviewing
  'APPROVED',       -- Admin approved, step complete
  'REJECTED'        -- Admin rejected, client must correct
);

-- =========================================================
-- ALTER TABLE: step_field_values
-- =========================================================

-- Add validation columns
ALTER TABLE step_field_values
  ADD COLUMN validation_status field_value_status DEFAULT 'PENDING' NOT NULL,
  ADD COLUMN rejection_reason text,
  ADD COLUMN reviewed_by uuid REFERENCES agents(id) ON DELETE SET NULL,
  ADD COLUMN reviewed_at timestamptz;

-- Add constraint: rejection_reason required when REJECTED
ALTER TABLE step_field_values
  ADD CONSTRAINT rejection_reason_required_when_rejected
  CHECK (
    validation_status != 'REJECTED' OR
    (rejection_reason IS NOT NULL AND length(trim(rejection_reason)) > 0)
  );

-- Add constraint: reviewed_by and reviewed_at required when APPROVED or REJECTED
ALTER TABLE step_field_values
  ADD CONSTRAINT review_metadata_required
  CHECK (
    validation_status = 'PENDING' OR
    (reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL)
  );

-- =========================================================
-- ALTER TABLE: step_instances
-- =========================================================

-- Add validation columns
ALTER TABLE step_instances
  ADD COLUMN validation_status step_validation_status DEFAULT 'DRAFT' NOT NULL,
  ADD COLUMN rejection_reason text,
  ADD COLUMN validated_by uuid REFERENCES agents(id) ON DELETE SET NULL,
  ADD COLUMN validated_at timestamptz;

-- Add constraint: rejection_reason required when REJECTED
ALTER TABLE step_instances
  ADD CONSTRAINT step_rejection_reason_required
  CHECK (
    validation_status != 'REJECTED' OR
    (rejection_reason IS NOT NULL AND length(trim(rejection_reason)) > 0)
  );

-- Add constraint: validated_by and validated_at required when APPROVED or REJECTED
ALTER TABLE step_instances
  ADD CONSTRAINT step_validation_metadata_required
  CHECK (
    validation_status IN ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW') OR
    (validated_by IS NOT NULL AND validated_at IS NOT NULL)
  );

-- =========================================================
-- NEW TABLE: step_field_value_reviews (Audit trail)
-- =========================================================

CREATE TABLE step_field_value_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relations
  step_field_value_id uuid NOT NULL REFERENCES step_field_values(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES agents(id) ON DELETE SET NULL,

  -- Status change
  old_status field_value_status,
  new_status field_value_status NOT NULL,

  -- Feedback
  comment text,

  -- Timestamp
  created_at timestamptz DEFAULT NOW() NOT NULL
);

-- Index for querying review history
CREATE INDEX idx_field_value_reviews_value_id ON step_field_value_reviews(step_field_value_id);
CREATE INDEX idx_field_value_reviews_reviewer ON step_field_value_reviews(reviewer_id);

-- =========================================================
-- NEW TABLE: step_instance_reviews (Audit trail)
-- =========================================================

CREATE TABLE step_instance_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relations
  step_instance_id uuid NOT NULL REFERENCES step_instances(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES agents(id) ON DELETE SET NULL,

  -- Status change
  old_status step_validation_status,
  new_status step_validation_status NOT NULL,

  -- Feedback
  comment text,

  -- Timestamp
  created_at timestamptz DEFAULT NOW() NOT NULL
);

-- Index for querying review history
CREATE INDEX idx_step_instance_reviews_instance_id ON step_instance_reviews(step_instance_id);
CREATE INDEX idx_step_instance_reviews_reviewer ON step_instance_reviews(reviewer_id);

-- =========================================================
-- INDEXES for filtering
-- =========================================================

-- Index for admin filtering by validation status
CREATE INDEX idx_step_field_values_validation_status ON step_field_values(validation_status);
CREATE INDEX idx_step_instances_validation_status ON step_instances(validation_status);

-- Index for finding pending reviews by dossier
CREATE INDEX idx_step_instances_dossier_validation ON step_instances(dossier_id, validation_status);

-- =========================================================
-- RLS POLICIES
-- =========================================================

-- Note: SELECT policies for step_field_values and step_instances already exist in migration 001
-- Note: UPDATE policy for step_instances already exists in migration 001

-- Allow agents to update validation fields on step_field_values
-- (SELECT policy already exists in migration 001)
CREATE POLICY "Agents can update validation status"
ON step_field_values FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM agents
    WHERE agents.id = auth.uid()
    AND agents.active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM agents
    WHERE agents.id = auth.uid()
    AND agents.active = true
  )
);

-- Allow agents to insert review records
CREATE POLICY "Agents can create field value reviews"
ON step_field_value_reviews FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM agents
    WHERE agents.id = auth.uid()
    AND agents.active = true
  )
);

CREATE POLICY "Agents can create step instance reviews"
ON step_instance_reviews FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM agents
    WHERE agents.id = auth.uid()
    AND agents.active = true
  )
);

-- Allow agents to view review history
CREATE POLICY "Agents can view field value reviews"
ON step_field_value_reviews FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM agents
    WHERE agents.id = auth.uid()
    AND agents.active = true
  )
);

CREATE POLICY "Agents can view step instance reviews"
ON step_instance_reviews FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM agents
    WHERE agents.id = auth.uid()
    AND agents.active = true
  )
);

-- Note: User SELECT policies for step_field_values and step_instances already exist in database-v2.sql
-- The existing policies "Users can view own step field values" and "Users can view own dossier steps"
-- already allow users to see validation status columns since they can SELECT their own records.
-- 
-- Users cannot UPDATE validation_status or rejection_reason because the existing UPDATE policy
-- "Users can update own step field values" only allows updates to value fields, not validation fields.

-- =========================================================
-- FUNCTIONS: Auto-logging review changes
-- =========================================================

-- Function to log field value status changes
CREATE OR REPLACE FUNCTION log_field_value_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if status changed and reviewer is set
  IF (OLD.validation_status IS DISTINCT FROM NEW.validation_status) AND NEW.reviewed_by IS NOT NULL THEN
    INSERT INTO step_field_value_reviews (
      step_field_value_id,
      reviewer_id,
      old_status,
      new_status,
      comment,
      created_at
    ) VALUES (
      NEW.id,
      NEW.reviewed_by,
      OLD.validation_status,
      NEW.validation_status,
      NEW.rejection_reason,  -- Use rejection_reason as comment
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on step_field_values
CREATE TRIGGER trigger_log_field_value_status_change
AFTER UPDATE ON step_field_values
FOR EACH ROW
EXECUTE FUNCTION log_field_value_status_change();

-- Function to log step instance status changes
CREATE OR REPLACE FUNCTION log_step_instance_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if status changed and validator is set
  IF (OLD.validation_status IS DISTINCT FROM NEW.validation_status) AND NEW.validated_by IS NOT NULL THEN
    INSERT INTO step_instance_reviews (
      step_instance_id,
      reviewer_id,
      old_status,
      new_status,
      comment,
      created_at
    ) VALUES (
      NEW.id,
      NEW.validated_by,
      OLD.validation_status,
      NEW.validation_status,
      NEW.rejection_reason,  -- Use rejection_reason as comment
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on step_instances
CREATE TRIGGER trigger_log_step_instance_status_change
AFTER UPDATE ON step_instances
FOR EACH ROW
EXECUTE FUNCTION log_step_instance_status_change();

-- =========================================================
-- HELPER VIEWS
-- =========================================================

-- View: Pending field values needing review
CREATE VIEW pending_field_values_for_review AS
SELECT
  sfv.*,
  sf.label as field_label,
  sf.field_key,
  si.dossier_id,
  d.user_id,
  p.full_name as client_name,
  s.label as step_label
FROM step_field_values sfv
JOIN step_fields sf ON sfv.step_field_id = sf.id
JOIN step_instances si ON sfv.step_instance_id = si.id
JOIN dossiers d ON si.dossier_id = d.id
JOIN profiles p ON d.user_id = p.id
JOIN steps s ON si.step_id = s.id
WHERE sfv.validation_status = 'PENDING';

-- View: Pending step instances needing review
CREATE VIEW pending_step_instances_for_review AS
SELECT
  si.*,
  s.label as step_label,
  s.code as step_code,
  d.user_id,
  p.full_name as client_name,
  COUNT(sfv.id) as total_fields,
  COUNT(sfv.id) FILTER (WHERE sfv.validation_status = 'APPROVED') as approved_fields,
  COUNT(sfv.id) FILTER (WHERE sfv.validation_status = 'REJECTED') as rejected_fields,
  COUNT(sfv.id) FILTER (WHERE sfv.validation_status = 'PENDING') as pending_fields
FROM step_instances si
JOIN steps s ON si.step_id = s.id
JOIN dossiers d ON si.dossier_id = d.id
JOIN profiles p ON d.user_id = p.id
LEFT JOIN step_field_values sfv ON si.id = sfv.step_instance_id
WHERE si.validation_status IN ('SUBMITTED', 'UNDER_REVIEW')
GROUP BY si.id, s.label, s.code, d.user_id, p.full_name;

-- =========================================================
-- COMMENTS
-- =========================================================

COMMENT ON COLUMN step_field_values.validation_status IS 'Admin validation status: PENDING (default), APPROVED, or REJECTED';
COMMENT ON COLUMN step_field_values.rejection_reason IS 'Admin feedback when rejecting a field value';
COMMENT ON COLUMN step_field_values.reviewed_by IS 'Agent who reviewed this field value';
COMMENT ON COLUMN step_field_values.reviewed_at IS 'Timestamp when field value was reviewed';

COMMENT ON COLUMN step_instances.validation_status IS 'Admin validation status: DRAFT, SUBMITTED, UNDER_REVIEW, APPROVED, or REJECTED';
COMMENT ON COLUMN step_instances.rejection_reason IS 'Admin feedback when rejecting a step instance';
COMMENT ON COLUMN step_instances.validated_by IS 'Agent who validated this step instance';
COMMENT ON COLUMN step_instances.validated_at IS 'Timestamp when step instance was validated';

COMMENT ON TABLE step_field_value_reviews IS 'Audit trail of all field value validation status changes';
COMMENT ON TABLE step_instance_reviews IS 'Audit trail of all step instance validation status changes';

COMMENT ON VIEW pending_field_values_for_review IS 'All field values awaiting admin review';
COMMENT ON VIEW pending_step_instances_for_review IS 'All step instances awaiting admin validation with field statistics';
