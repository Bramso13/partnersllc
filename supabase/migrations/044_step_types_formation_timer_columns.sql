-- =========================================================
-- Story 4.19: Step types FORMATION and TIMER (Part 2)
-- =========================================================
-- formation_id and timer_delay_minutes on STEPS (not product_steps).
-- Run after 043 (enum values committed).
-- =========================================================

-- Drop old check constraint (only allowed CLIENT, ADMIN)
ALTER TABLE steps DROP CONSTRAINT IF EXISTS step_type_check;

-- Re-add check for documentation (enum already enforces values)
ALTER TABLE steps
  ADD CONSTRAINT step_type_check CHECK (
    step_type IN ('CLIENT', 'ADMIN', 'FORMATION', 'TIMER')
  );

COMMENT ON TYPE step_type IS 'Type of workflow step: CLIENT, ADMIN, FORMATION (training), or TIMER (delay before next step)';

-- =========================================================
-- STEPS: formation_id and timer_delay_minutes (on step, not product_step)
-- =========================================================
ALTER TABLE steps
  ADD COLUMN IF NOT EXISTS formation_id uuid REFERENCES formations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS timer_delay_minutes int;

COMMENT ON COLUMN steps.formation_id IS 'For steps of type FORMATION: which formation to display.';
COMMENT ON COLUMN steps.timer_delay_minutes IS 'For steps of type TIMER: delay in minutes before next step is available after previous step completion. Must be > 0 when step is TIMER.';

-- Allow only null or positive timer_delay_minutes on steps
ALTER TABLE steps
  DROP CONSTRAINT IF EXISTS steps_timer_delay_positive;
ALTER TABLE steps
  ADD CONSTRAINT steps_timer_delay_positive
  CHECK (timer_delay_minutes IS NULL OR timer_delay_minutes > 0);

CREATE INDEX IF NOT EXISTS idx_steps_formation_id ON steps(formation_id);

-- Remove from product_steps if they were added by a previous version of this migration
ALTER TABLE product_steps DROP COLUMN IF EXISTS formation_id;
ALTER TABLE product_steps DROP COLUMN IF EXISTS timer_delay_minutes;
DROP INDEX IF EXISTS idx_product_steps_formation_id;

-- =========================================================
-- AUTO-ASSIGNMENT: FORMATION and TIMER → no agent (AC: 7)
-- =========================================================
CREATE OR REPLACE FUNCTION get_next_agent_for_step_type(p_step_type step_type)
RETURNS uuid AS $$
DECLARE
  v_agent_type agent_type;
  v_agent_id uuid;
BEGIN
  -- Map step_type -> agent_type (FORMATION and TIMER: no assignment)
  v_agent_type := CASE p_step_type
    WHEN 'CLIENT' THEN 'VERIFICATEUR'::agent_type
    WHEN 'ADMIN' THEN 'CREATEUR'::agent_type
    WHEN 'FORMATION' THEN NULL
    WHEN 'TIMER' THEN NULL
    ELSE NULL
  END;

  IF v_agent_type IS NULL THEN
    RETURN NULL;
  END IF;

  -- Load balancing: agent with fewest incomplete steps
  SELECT a.id
  INTO v_agent_id
  FROM agents a
  LEFT JOIN step_instances si
    ON si.assigned_to = a.id
   AND si.completed_at IS NULL
  WHERE a.active = true
    AND a.agent_type = v_agent_type
  GROUP BY a.id, a.created_at
  ORDER BY count(si.id) ASC, a.created_at ASC
  LIMIT 1;

  RETURN v_agent_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_next_agent_for_step_type(step_type)
  IS 'Returns next available agent for step type. FORMATION and TIMER return NULL (no assignment).';
