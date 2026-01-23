-- =========================================================
-- EVENT NOTIFICATION TRIGGER
-- Story 3.9: Event-to-Notification Orchestration System
-- =========================================================
-- This migration creates a trigger to automatically process events
-- for notification orchestration when they are inserted.
--
-- Options implemented:
-- 1. Simple marker flag (processed_for_notifications) - Used by cron job
-- 2. Webhook trigger using pg_net (if extension is available)
-- =========================================================

-- =========================================================
-- OPTION 1: Add processed flag to events table
-- =========================================================
-- Note: This is a lightweight approach that doesn't modify the events table
-- Instead, we rely on notification_rule_executions table to track processing

-- =========================================================
-- OPTION 2: Webhook trigger using pg_net (if available)
-- =========================================================
-- Note: This requires the pg_net extension to be installed
-- If pg_net is not available, use the cron job approach instead

-- Check if pg_net extension exists
do $$
begin
  -- Try to enable pg_net extension
  -- This may fail if extension is not available in your Supabase instance
  begin
    create extension if not exists pg_net;
  exception when others then
    raise notice 'pg_net extension not available - webhook trigger will not be created';
    raise notice 'Use cron job approach: Call POST /api/cron/process-event-notifications every 10 seconds';
  end;
end $$;

-- =========================================================
-- FUNCTION: Trigger webhook for event processing
-- =========================================================
create or replace function trigger_event_notification_webhook()
returns trigger as $$
declare
  v_webhook_url text;
  v_cron_secret text;
  v_request_id bigint;
begin
  -- Get webhook URL from environment (via Supabase secrets)
  -- Format: https://your-app.vercel.app/api/cron/process-event-notifications
  v_webhook_url := current_setting('app.settings.webhook_url', true);
  v_cron_secret := current_setting('app.settings.cron_secret', true);

  -- Only trigger webhook if pg_net is available and URL is configured
  if v_webhook_url is not null and exists (
    select 1 from pg_extension where extname = 'pg_net'
  ) then
    -- Call webhook asynchronously using pg_net
    select net.http_post(
      url := v_webhook_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || coalesce(v_cron_secret, '')
      ),
      body := jsonb_build_object(
        'event_id', new.id,
        'event_type', new.event_type,
        'trigger', 'database'
      )
    ) into v_request_id;

    raise notice 'Triggered webhook for event % (request_id: %)', new.id, v_request_id;
  end if;

  return new;
exception when others then
  -- Don't fail event insertion if webhook fails
  raise warning 'Failed to trigger webhook for event %: %', new.id, sqlerrm;
  return new;
end;
$$ language plpgsql security definer;

comment on function trigger_event_notification_webhook() is 'Triggers webhook to process event notifications (requires pg_net extension)';

-- =========================================================
-- TRIGGER: Auto-process event notifications
-- =========================================================
-- Note: This trigger is created only if pg_net extension exists
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_net') then
    -- Drop trigger if exists
    drop trigger if exists event_notification_webhook on events;

    -- Create trigger
    create trigger event_notification_webhook
      after insert on events
      for each row
      execute function trigger_event_notification_webhook();

    raise notice 'Created webhook trigger for event notifications';
  else
    raise notice 'Webhook trigger not created - pg_net extension not available';
    raise notice 'SETUP REQUIRED: Configure Vercel Cron to call POST /api/cron/process-event-notifications every 10 seconds';
  end;
end $$;

-- =========================================================
-- ALTERNATIVE: Direct processing function (for manual use)
-- =========================================================
-- This function can be called manually to process a specific event
create or replace function process_event_notifications_sync(p_event_id uuid)
returns jsonb as $$
declare
  v_result jsonb;
begin
  -- This is a placeholder that would need to be implemented in application code
  -- For now, it just returns a message
  return jsonb_build_object(
    'success', true,
    'message', 'Event marked for processing',
    'event_id', p_event_id,
    'note', 'Actual processing happens via API endpoint: POST /api/cron/process-event-notifications'
  );
end;
$$ language plpgsql security definer;

comment on function process_event_notifications_sync(uuid) is 'Manual trigger to process event notifications (placeholder - actual processing via API)';

-- =========================================================
-- CONFIGURATION INSTRUCTIONS
-- =========================================================
-- To enable automatic event processing, choose ONE of these options:
--
-- OPTION A: Webhook Trigger (Immediate Processing)
-- 1. Ensure pg_net extension is enabled: CREATE EXTENSION IF NOT EXISTS pg_net;
-- 2. Set webhook URL via Supabase Dashboard > Settings > Vault:
--    - Key: app.settings.webhook_url
--    - Value: https://your-app.vercel.app/api/cron/process-event-notifications
-- 3. Set cron secret:
--    - Key: app.settings.cron_secret
--    - Value: Your secret key (same as CRON_SECRET env var)
-- 4. The trigger will automatically call the webhook for each new event
--
-- OPTION B: Cron Job (Periodic Processing)
-- 1. Add to vercel.json:
--    {
--      "crons": [{
--        "path": "/api/cron/process-event-notifications",
--        "schedule": "*/10 * * * * *"  // Every 10 seconds
--      }]
--    }
-- 2. Set CRON_SECRET environment variable in Vercel
-- 3. Events will be processed every 10 seconds
--
-- OPTION C: Manual/On-Demand
-- - Call POST /api/cron/process-event-notifications manually
-- - Useful for testing or recovery scenarios
--
-- =========================================================
