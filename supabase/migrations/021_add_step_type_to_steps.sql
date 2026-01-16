-- =========================================================
-- ADD STEP_TYPE COLUMN TO STEPS TABLE
-- Story 3.8: Admin Document Delivery to Clients
-- =========================================================
-- This migration:
-- 1. Creates step_type enum with values: 'CLIENT', 'ADMIN'
-- 2. Adds step_type column to steps table with default 'CLIENT'
-- 3. Updates existing steps to 'CLIENT' type
-- 4. Adds constraint and index for performance
-- =========================================================

-- =========================================================
-- CREATE STEP_TYPE ENUM
-- =========================================================
create type step_type as enum ('CLIENT', 'ADMIN');

comment on type step_type is 'Type of workflow step: CLIENT (default) or ADMIN (admin-managed step)';

-- =========================================================
-- ADD STEP_TYPE COLUMN TO STEPS TABLE
-- =========================================================
alter table steps
  add column step_type step_type not null default 'CLIENT';

comment on column steps.step_type is 'Type of step: CLIENT (default) or ADMIN (admin-managed)';

-- =========================================================
-- UPDATE EXISTING STEPS TO CLIENT TYPE
-- =========================================================
-- All existing steps are client steps by default
update steps set step_type = 'CLIENT' where step_type is null;

-- =========================================================
-- ADD CONSTRAINT
-- =========================================================
alter table steps
  add constraint step_type_check check (step_type in ('CLIENT', 'ADMIN'));

-- =========================================================
-- ADD INDEX FOR FILTERING ADMIN STEPS
-- =========================================================
create index idx_steps_step_type on steps(step_type);

comment on index idx_steps_step_type is 'Index for filtering steps by type (CLIENT vs ADMIN)';
