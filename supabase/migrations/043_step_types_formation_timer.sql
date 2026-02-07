-- =========================================================
-- Story 4.19: Step types FORMATION and TIMER (Part 1)
-- =========================================================
-- Add new enum values only. PostgreSQL requires new enum values
-- to be committed before they can be used (e.g. in CHECK constraints).
-- Part 2: 044_step_types_formation_timer_columns.sql
-- =========================================================

ALTER TYPE step_type ADD VALUE 'FORMATION';
ALTER TYPE step_type ADD VALUE 'TIMER';
