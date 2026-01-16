-- =========================================================
-- ADD DOCUMENT_DELIVERED TO EVENT_TYPE ENUM
-- Story 3.8: Admin Document Delivery to Clients
-- =========================================================
-- This migration:
-- 1. Adds 'DOCUMENT_DELIVERED' to event_type enum
-- =========================================================

-- =========================================================
-- ADD DOCUMENT_DELIVERED TO EVENT_TYPE ENUM
-- =========================================================
-- Note: PostgreSQL doesn't support adding values to existing enums directly
-- We need to alter the type by creating a new enum and replacing it
do $$
begin
  -- Check if DOCUMENT_DELIVERED already exists
  if not exists (
    select 1 from pg_enum 
    where enumlabel = 'DOCUMENT_DELIVERED' 
    and enumtypid = (select oid from pg_type where typname = 'event_type')
  ) then
    alter type event_type add value 'DOCUMENT_DELIVERED';
  end if;
end $$;

comment on type event_type is 'Event types including DOCUMENT_DELIVERED for admin document delivery';
