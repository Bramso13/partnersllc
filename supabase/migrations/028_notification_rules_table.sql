-- =========================================================
-- NOTIFICATION RULES AND RULE EXECUTIONS TABLES
-- Story 3.9: Event-to-Notification Orchestration System
-- =========================================================
-- This migration:
-- 1. Creates notification_rules table for centralized event-to-notification mapping
-- 2. Creates notification_rule_executions table for logging and debugging
-- 3. Adds indexes for optimal query performance
-- =========================================================

-- =========================================================
-- TABLE: notification_rules
-- =========================================================
create table if not exists notification_rules (
  id uuid primary key default gen_random_uuid(),
  event_type event_types not null,
  template_code text not null,
  channels text[] not null default array[]::text[],
  is_active boolean not null default true,
  priority integer not null default 0,
  conditions jsonb null,
  description text not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),

  -- Ensure channels array contains valid channel types
  constraint valid_channels check (
    channels <@ array['EMAIL', 'WHATSAPP', 'IN_APP', 'SMS']::text[]
  ),

  -- Ensure priority is non-negative
  constraint valid_priority check (priority >= 0)
);

comment on table notification_rules is 'Centralized event-to-notification orchestration rules';
comment on column notification_rules.event_type is 'The event type that triggers this rule';
comment on column notification_rules.template_code is 'The notification template to use (e.g., STEP_COMPLETED, DOCUMENT_APPROVED)';
comment on column notification_rules.channels is 'Array of channels to send notification through (EMAIL, WHATSAPP, IN_APP, SMS)';
comment on column notification_rules.is_active is 'Whether this rule is currently active';
comment on column notification_rules.priority is 'Rule execution priority (higher number = higher priority)';
comment on column notification_rules.conditions is 'Optional JSONB conditions for when to apply the rule';
comment on column notification_rules.description is 'Human-readable description of what this rule does';

-- =========================================================
-- TABLE: notification_rule_executions
-- =========================================================
create table if not exists notification_rule_executions (
  id uuid primary key default gen_random_uuid(),
  rule_id uuid not null references notification_rules(id) on delete cascade,
  event_id uuid not null references events(id) on delete cascade,
  notification_id uuid null references notifications(id) on delete set null,
  success boolean not null default false,
  error_message text null,
  retry_count integer not null default 0,
  executed_at timestamp with time zone not null default now(),

  -- Ensure retry_count is non-negative
  constraint valid_retry_count check (retry_count >= 0)
);

comment on table notification_rule_executions is 'Log of notification rule executions for monitoring and debugging';
comment on column notification_rule_executions.rule_id is 'The notification rule that was executed';
comment on column notification_rule_executions.event_id is 'The event that triggered this rule';
comment on column notification_rule_executions.notification_id is 'The notification created (null if creation failed)';
comment on column notification_rule_executions.success is 'Whether the rule execution succeeded';
comment on column notification_rule_executions.error_message is 'Error message if execution failed';
comment on column notification_rule_executions.retry_count is 'Number of retry attempts (0 for first attempt)';
comment on column notification_rule_executions.executed_at is 'When this rule was executed';

-- =========================================================
-- INDEXES: notification_rules
-- =========================================================
-- Index for finding active rules by event type (most common query)
create index if not exists idx_notification_rules_event_type_active
  on notification_rules(event_type, is_active, priority desc)
  where is_active = true;

comment on index idx_notification_rules_event_type_active is 'Optimizes queries for active rules by event type, ordered by priority';

-- Index for admin UI filtering
create index if not exists idx_notification_rules_is_active
  on notification_rules(is_active);

comment on index idx_notification_rules_is_active is 'Optimizes filtering rules by active status in admin UI';

-- Index for priority-based execution
create index if not exists idx_notification_rules_priority
  on notification_rules(priority desc);

comment on index idx_notification_rules_priority is 'Optimizes sorting rules by priority for execution order';

-- =========================================================
-- INDEXES: notification_rule_executions
-- =========================================================
-- Index for finding executions by rule
create index if not exists idx_notification_rule_executions_rule_id
  on notification_rule_executions(rule_id, executed_at desc);

comment on index idx_notification_rule_executions_rule_id is 'Optimizes queries for rule execution history';

-- Index for finding executions by event
create index if not exists idx_notification_rule_executions_event_id
  on notification_rule_executions(event_id, executed_at desc);

comment on index idx_notification_rule_executions_event_id is 'Optimizes queries for event processing history';

-- Index for finding failed executions (for retry mechanism)
create index if not exists idx_notification_rule_executions_failed
  on notification_rule_executions(success, retry_count, executed_at desc)
  where success = false;

comment on index idx_notification_rule_executions_failed is 'Optimizes queries for failed executions that need retry';

-- Index for finding recent executions (monitoring dashboard)
create index if not exists idx_notification_rule_executions_recent
  on notification_rule_executions(executed_at desc);

comment on index idx_notification_rule_executions_recent is 'Optimizes queries for recent rule executions in monitoring dashboard';

-- =========================================================
-- FUNCTION: Update updated_at timestamp
-- =========================================================
create or replace function update_notification_rule_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

comment on function update_notification_rule_timestamp() is 'Automatically updates updated_at timestamp on notification_rules';

-- =========================================================
-- TRIGGER: Auto-update updated_at
-- =========================================================
create trigger notification_rule_updated
  before update on notification_rules
  for each row
  execute function update_notification_rule_timestamp();

comment on trigger notification_rule_updated on notification_rules is 'Automatically updates updated_at timestamp when rule is modified';

-- =========================================================
-- RLS POLICIES: notification_rules
-- =========================================================
-- Enable RLS on notification_rules
alter table notification_rules enable row level security;

-- Admin users can do everything with notification rules
create policy "Admins can manage notification rules"
  on notification_rules
  for all
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'ADMIN'
    )
  );

-- All authenticated users can view active notification rules (for transparency)
create policy "Authenticated users can view active notification rules"
  on notification_rules
  for select
  using (
    auth.uid() is not null
    and is_active = true
  );

comment on policy "Admins can manage notification rules" on notification_rules is 'Admins have full access to manage notification rules';
comment on policy "Authenticated users can view active notification rules" on notification_rules is 'All authenticated users can view active rules for transparency';

-- =========================================================
-- RLS POLICIES: notification_rule_executions
-- =========================================================
-- Enable RLS on notification_rule_executions
alter table notification_rule_executions enable row level security;

-- Admin users can view all rule executions
create policy "Admins can view notification rule executions"
  on notification_rule_executions
  for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'ADMIN'
    )
  );

-- System can insert rule executions (via service role)
-- No policy needed - will use service role

comment on policy "Admins can view notification rule executions" on notification_rule_executions is 'Admins can view all rule execution logs for monitoring';

-- =========================================================
-- RETENTION POLICY: notification_rule_executions
-- =========================================================
-- Note: Retention policy (delete executions older than 30 days) will be implemented
-- via a scheduled Edge Function or cron job, not in this migration
