-- =========================================================
-- EMAIL NOTIFICATION DELIVERY SYSTEM
-- Story 3.2: Email Notification Delivery System
-- =========================================================
-- This migration:
-- 1. Creates trigger to auto-create EMAIL delivery when notification is created
-- 2. Adds function to get user email from auth.users
-- =========================================================

-- =========================================================
-- FUNCTION: Get user email from auth.users
-- =========================================================
create or replace function get_user_email(p_user_id uuid)
returns text as $$
declare
  v_email text;
begin
  -- Get email from auth.users (requires admin access)
  -- Note: This function uses SECURITY DEFINER to access auth.users
  select email into v_email
  from auth.users
  where id = p_user_id;

  return v_email;
end;
$$ language plpgsql security definer;

comment on function get_user_email(uuid) is 'Gets user email from auth.users table (requires admin privileges)';

-- =========================================================
-- FUNCTION: Create EMAIL delivery for notification
-- =========================================================
create or replace function create_email_delivery_for_notification()
returns trigger as $$
declare
  v_user_email text;
begin
  -- Get user email
  v_user_email := get_user_email(new.user_id);

  -- Only create delivery if user has email
  if v_user_email is not null and length(trim(v_user_email)) > 0 then
    insert into notification_deliveries (
      notification_id,
      channel,
      recipient,
      status,
      provider
    )
    values (
      new.id,
      'EMAIL',
      v_user_email,
      'PENDING',
      'nodemailer'
    );
  end if;

  return new;
end;
$$ language plpgsql security definer;

comment on function create_email_delivery_for_notification() is 'Automatically creates EMAIL delivery record when notification is created';

-- =========================================================
-- TRIGGER: Auto-create EMAIL delivery
-- =========================================================
create trigger notification_email_delivery_created
  after insert on notifications
  for each row
  execute function create_email_delivery_for_notification();

comment on trigger notification_email_delivery_created on notifications is 'Automatically creates EMAIL delivery when notification is inserted';

-- =========================================================
-- INDEX: Optimize pending email deliveries query
-- =========================================================
create index if not exists idx_notification_deliveries_pending_email
  on notification_deliveries(channel, status, created_at)
  where channel = 'EMAIL' and status = 'PENDING';

comment on index idx_notification_deliveries_pending_email is 'Optimizes query for pending email deliveries';
