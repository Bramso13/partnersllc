-- =========================================================
-- PARTNERS VRAI - DATABASE SCHEMA V2
-- =========================================================
-- Modular SaaS Platform for Business Services
-- Next.js + Supabase + Stripe
--
-- Features:
-- - Multi-product support (LLC, CORP, BANKING, etc.)
-- - Payment links workflow (Pre-registration → Payment → Dossier)
-- - Event-driven architecture
-- - Multi-channel notifications
-- - Document versioning & reviews
-- - Full audit trail
-- - Row Level Security (RLS)
-- =========================================================

-- =========================================================
-- EXTENSIONS
-- =========================================================
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- =========================================================
-- ENUMS
-- =========================================================

-- User status (for payment flow)
create type user_status as enum (
  'PENDING',      -- Registered but not yet paid
  'ACTIVE',       -- Paid and active
  'SUSPENDED'     -- Payment failed or account suspended
);

-- Dossier types
create type dossier_type as enum (
  'LLC',
  'CORP',
  'DUBAI',
  'BANKING',
  'COMPLIANCE',
  'ACCOUNTING'
);

-- Dossier status codes
create type dossier_status_code as enum (
  'QUALIFICATION',
  'FORM_SUBMITTED',
  'NM_PENDING',
  'LLC_ACCEPTED',
  'EIN_PENDING',
  'BANK_PREPARATION',
  'BANK_OPENED',
  'WAITING_48H',
  'IN_PROGRESS',
  'UNDER_REVIEW',
  'COMPLETED',
  'CLOSED',
  'ERROR'
);

-- Document status
create type document_status as enum (
  'PENDING',
  'APPROVED',
  'REJECTED',
  'OUTDATED'
);

-- Review status
create type review_status as enum (
  'APPROVED',
  'REJECTED'
);

-- Event types
create type event_type as enum (
  'DOSSIER_CREATED',
  'DOSSIER_STATUS_CHANGED',
  'STEP_STARTED',
  'STEP_COMPLETED',
  'DOCUMENT_UPLOADED',
  'DOCUMENT_REVIEWED',
  'PAYMENT_RECEIVED',
  'PAYMENT_FAILED',
  'MESSAGE_SENT',
  'ERROR'
);

-- Notification channels
create type notification_channel as enum (
  'WHATSAPP',
  'EMAIL',
  'IN_APP',
  'SMS',
  'PUSH'
);

-- Notification status
create type notification_status as enum (
  'PENDING',
  'SENT',
  'FAILED',
  'BOUNCED'
);

-- Order status
create type order_status as enum (
  'PENDING',      -- Waiting for payment
  'PAID',         -- Successfully paid
  'FAILED',       -- Payment failed
  'REFUNDED',     -- Refunded
  'CANCELLED'     -- Cancelled
);

-- Actor type (for polymorphic references)
create type actor_type as enum (
  'USER',
  'AGENT',
  'SYSTEM'
);

-- =========================================================
-- PROFILES (linked to auth.users)
-- =========================================================
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,

  -- Basic info
  full_name text,
  phone text,

  -- Status
  status user_status default 'PENDING' not null,

  -- Stripe
  stripe_customer_id text unique,

  -- Timestamps
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- =========================================================
-- AGENTS
-- =========================================================
create table agents (
  id uuid primary key default gen_random_uuid(),

  -- Identity
  email text unique not null,
  name text not null,

  -- Status
  active boolean default true not null,

  -- Timestamps
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- =========================================================
-- PRODUCTS / SERVICES
-- =========================================================
create table products (
  id uuid primary key default gen_random_uuid(),

  -- Identity
  code text unique not null,  -- e.g., 'LLC_FORMATION', 'DUBAI_SETUP'
  name text not null,
  description text,

  -- Linked dossier type
  dossier_type dossier_type not null,

  -- Stripe integration
  stripe_product_id text unique,  -- prod_xxxxx
  stripe_price_id text,           -- price_xxxxx
  price_amount integer not null,  -- in cents (e.g., 99900 = $999.00)
  currency text default 'USD' not null,

  -- Workflow
  initial_status dossier_status_code default 'QUALIFICATION' not null,

  -- Status
  active boolean default true not null,

  -- Timestamps
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,

  -- Constraints
  constraint price_amount_positive check (price_amount >= 0)
);

-- =========================================================
-- STEPS (workflow steps definitions)
-- =========================================================
create table steps (
  id uuid primary key default gen_random_uuid(),

  -- Identity
  code text unique not null,  -- e.g., 'QUALIFICATION', 'DOCUMENT_COLLECTION'
  label text not null,
  description text,

  -- Position (global ordering)
  position int not null,

  -- Timestamps
  created_at timestamptz default now() not null,

  -- Constraints
  constraint position_positive check (position >= 0)
);

-- =========================================================
-- PRODUCT STEPS (which steps for which product)
-- =========================================================
create table product_steps (
  id uuid primary key default gen_random_uuid(),

  -- Relations
  product_id uuid not null references products(id) on delete cascade,
  step_id uuid not null references steps(id) on delete cascade,

  -- Ordering per product
  position int not null,

  -- Configuration
  is_required boolean default true not null,
  estimated_duration_hours int,

  -- Timestamps
  created_at timestamptz default now() not null,

  -- Constraints
  unique(product_id, step_id),
  unique(product_id, position),
  constraint position_positive check (position >= 0)
);

-- =========================================================
-- STEP DOCUMENT TYPES (many-to-many join table)
-- =========================================================
-- Maps which document types are required for which workflow steps.
-- Documents are defined at the STEP level, shared across all products.
-- All products using the same step will have the same document requirements.
--
-- Example: Step "QUALIFICATION" always requires [Passport, Proof of Address]
--          regardless of product (LLC, CORP, DUBAI, etc.)
-- =========================================================

create table if not exists step_document_types (
  id uuid primary key default gen_random_uuid(),

  -- Relations
  step_id uuid not null references steps(id) on delete cascade,
  document_type_id uuid not null references document_types(id) on delete cascade,

  -- Timestamps
  created_at timestamptz default now() not null,

  -- Constraints
  unique(step_id, document_type_id)
);

-- =========================================================
-- DOCUMENT TYPES
-- =========================================================
create table document_types (
  id uuid primary key default gen_random_uuid(),

  -- Identity
  code text unique not null,  -- e.g., 'PASSPORT', 'PROOF_ADDRESS'
  label text not null,
  description text,

  -- Configuration
  required_step_id uuid references steps(id) on delete set null,
  max_file_size_mb int default 10,
  allowed_extensions text[] default array['pdf', 'jpg', 'png'],

  -- Timestamps
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- =========================================================
-- PAYMENT LINKS (generated by admin)
-- =========================================================
create table payment_links (
  id uuid primary key default gen_random_uuid(),

  -- Unique link
  token text unique not null,  -- URL: /register/{token}

  -- Product
  product_id uuid not null references products(id) on delete restrict,

  -- Prospect info
  prospect_email text not null,
  prospect_name text,

  -- Stripe
  stripe_checkout_session_id text unique,

  -- Tracking
  created_by uuid references agents(id) on delete set null,
  expires_at timestamptz,
  used_at timestamptz,
  used_by uuid references profiles(id) on delete set null,

  -- Timestamps
  created_at timestamptz default now() not null,

  -- Constraints
  constraint token_format check (length(token) >= 16),
  constraint expires_after_creation check (expires_at is null or expires_at > created_at)
);

-- =========================================================
-- DOSSIERS
-- =========================================================
create table dossiers (
  id uuid primary key default gen_random_uuid(),

  -- Relations
  user_id uuid not null references profiles(id) on delete cascade,
  product_id uuid references products(id) on delete set null,

  -- Type & Status
  type dossier_type not null,
  status dossier_status_code not null,

  -- Current step
  current_step_instance_id uuid,  -- Will be linked after step_instances table

  -- Metadata
  metadata jsonb default '{}'::jsonb,

  -- Timestamps
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  completed_at timestamptz,

  -- Constraints
  constraint completed_at_after_creation check (completed_at is null or completed_at >= created_at)
);

-- =========================================================
-- DOSSIER STATUS HISTORY (audit trail)
-- =========================================================
create table dossier_status_history (
  id uuid primary key default gen_random_uuid(),

  -- Relations
  dossier_id uuid not null references dossiers(id) on delete cascade,

  -- Status change
  old_status dossier_status_code,
  new_status dossier_status_code not null,

  -- Actor (polymorphic)
  changed_by_type actor_type,
  changed_by_id uuid,

  -- Context
  reason text,
  metadata jsonb default '{}'::jsonb,

  -- Timestamp
  created_at timestamptz default now() not null
);

-- =========================================================
-- STEP INSTANCES (steps execution per dossier)
-- =========================================================
create table step_instances (
  id uuid primary key default gen_random_uuid(),

  -- Relations
  dossier_id uuid not null references dossiers(id) on delete cascade,
  step_id uuid not null references steps(id) on delete restrict,

  -- Assigned agent
  assigned_to uuid references agents(id) on delete set null,

  -- Timestamps
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now() not null,

  -- Metadata
  metadata jsonb default '{}'::jsonb,

  -- Constraints
  unique(dossier_id, step_id),
  constraint completed_after_started check (completed_at is null or completed_at >= started_at)
);

-- Now we can add the foreign key for current_step_instance_id
alter table dossiers
  add constraint fk_current_step_instance
  foreign key (current_step_instance_id)
  references step_instances(id)
  on delete set null;

-- =========================================================
-- STEP FIELDS (custom form fields per step)
-- =========================================================
create table step_fields (
  id uuid primary key default gen_random_uuid(),

  -- Relations
  step_id uuid not null references steps(id) on delete cascade,

  -- Field identity
  field_key text not null,  -- e.g., 'company_name', 'ein_number'
  label text not null,
  description text,
  placeholder text,

  -- Field type
  field_type text not null,  -- 'text', 'textarea', 'number', 'email', 'phone', 'date', 'select', 'radio', 'checkbox', 'file'

  -- Validation
  is_required boolean default false not null,
  min_length int,
  max_length int,
  min_value numeric,
  max_value numeric,
  pattern text,  -- regex pattern for validation

  -- Options (for select, radio, checkbox)
  options jsonb default '[]'::jsonb,  -- [{"value": "llc", "label": "LLC"}, ...]

  -- Configuration
  help_text text,
  default_value text,

  -- Positioning
  position int not null,

  -- Timestamps
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,

  -- Constraints
  unique(step_id, field_key),
  unique(step_id, position),
  constraint position_positive check (position >= 0),
  constraint field_key_format check (field_key ~ '^[a-z][a-z0-9_]*$')
);

-- =========================================================
-- STEP FIELD VALUES (user responses to custom fields)
-- =========================================================
create table step_field_values (
  id uuid primary key default gen_random_uuid(),

  -- Relations
  step_instance_id uuid not null references step_instances(id) on delete cascade,
  step_field_id uuid not null references step_fields(id) on delete restrict,

  -- Value storage
  value text,  -- Single value or JSON for complex types
  value_jsonb jsonb,  -- For arrays, objects, etc.

  -- File reference (if field_type = 'file')
  file_url text,
  file_name text,
  file_size_bytes bigint,

  -- Audit
  created_by_type actor_type not null,
  created_by_id uuid not null,

  -- Timestamps
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,

  -- Constraints
  unique(step_instance_id, step_field_id),
  constraint file_size_positive check (file_size_bytes is null or file_size_bytes > 0)
);

-- =========================================================
-- DOCUMENTS
-- =========================================================
create table documents (
  id uuid primary key default gen_random_uuid(),

  -- Relations
  dossier_id uuid not null references dossiers(id) on delete cascade,
  document_type_id uuid not null references document_types(id) on delete restrict,
  step_instance_id uuid references step_instances(id) on delete set null,

  -- Status
  status document_status default 'PENDING' not null,

  -- Current version
  current_version_id uuid,  -- Will be linked after document_versions table

  -- Timestamps
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- =========================================================
-- DOCUMENT VERSIONS (versioning)
-- =========================================================
create table document_versions (
  id uuid primary key default gen_random_uuid(),

  -- Relations
  document_id uuid not null references documents(id) on delete cascade,

  -- File info
  file_url text not null,
  file_name text,
  file_size_bytes bigint,
  mime_type text,

  -- Upload info
  uploaded_by_type actor_type not null,
  uploaded_by_id uuid not null,

  -- Version
  version_number int not null default 1,

  -- Timestamp
  uploaded_at timestamptz default now() not null,

  -- Constraints
  unique(document_id, version_number),
  constraint version_number_positive check (version_number > 0),
  constraint file_size_positive check (file_size_bytes is null or file_size_bytes > 0)
);

-- Now we can add the foreign key for current_version_id
alter table documents
  add constraint fk_current_version
  foreign key (current_version_id)
  references document_versions(id)
  on delete set null;

-- =========================================================
-- DOCUMENT REVIEWS
-- =========================================================
create table document_reviews (
  id uuid primary key default gen_random_uuid(),

  -- Relations
  document_version_id uuid not null references document_versions(id) on delete cascade,
  reviewer_id uuid not null references agents(id) on delete restrict,

  -- Review
  status review_status not null,
  reason text,
  notes text,

  -- Timestamp
  reviewed_at timestamptz default now() not null
);

-- =========================================================
-- ORDERS
-- =========================================================
create table orders (
  id uuid primary key default gen_random_uuid(),

  -- Relations
  user_id uuid not null references profiles(id) on delete cascade,
  product_id uuid not null references products(id) on delete restrict,
  payment_link_id uuid references payment_links(id) on delete set null,
  dossier_id uuid references dossiers(id) on delete set null,

  -- Amount
  amount integer not null,
  currency text default 'USD' not null,

  -- Status
  status order_status default 'PENDING' not null,

  -- Stripe
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text unique,
  stripe_customer_id text,

  -- Metadata
  metadata jsonb default '{}'::jsonb,

  -- Timestamps
  paid_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,

  -- Constraints
  constraint amount_positive check (amount > 0)
);

-- =========================================================
-- MESSAGES (communication)
-- =========================================================
create table messages (
  id uuid primary key default gen_random_uuid(),

  -- Relations
  dossier_id uuid not null references dossiers(id) on delete cascade,

  -- Sender (polymorphic)
  sender_type actor_type not null,
  sender_id uuid not null,

  -- Content
  content text not null,
  attachments jsonb default '[]'::jsonb,

  -- Read tracking
  read_at timestamptz,

  -- Timestamp
  created_at timestamptz default now() not null,

  -- Constraints
  constraint content_not_empty check (length(trim(content)) > 0)
);

-- =========================================================
-- EVENTS (event sourcing)
-- =========================================================
create table events (
  id uuid primary key default gen_random_uuid(),

  -- Entity (polymorphic)
  entity_type text not null,
  entity_id uuid not null,

  -- Event
  event_type event_type not null,

  -- Actor (polymorphic, optional)
  actor_type actor_type,
  actor_id uuid,

  -- Payload
  payload jsonb default '{}'::jsonb,

  -- Timestamp (immutable)
  created_at timestamptz default now() not null,

  -- Indexes will be created below
  constraint entity_type_not_empty check (length(trim(entity_type)) > 0)
);

-- =========================================================
-- NOTIFICATIONS (logical notifications)
-- =========================================================
create table notifications (
  id uuid primary key default gen_random_uuid(),

  -- Relations
  user_id uuid not null references profiles(id) on delete cascade,
  dossier_id uuid references dossiers(id) on delete cascade,
  event_id uuid references events(id) on delete set null,

  -- Content
  title text not null,
  message text not null,

  -- Template
  template_code text,
  payload jsonb default '{}'::jsonb,

  -- Action
  action_url text,

  -- Read tracking
  read_at timestamptz,

  -- Timestamps
  created_at timestamptz default now() not null
);

-- =========================================================
-- NOTIFICATION DELIVERIES (multi-channel)
-- =========================================================
create table notification_deliveries (
  id uuid primary key default gen_random_uuid(),

  -- Relations
  notification_id uuid not null references notifications(id) on delete cascade,

  -- Channel
  channel notification_channel not null,
  recipient text not null,

  -- Status
  status notification_status default 'PENDING' not null,

  -- Provider response
  provider text,  -- e.g., 'sendgrid', 'twilio'
  provider_message_id text,
  provider_response jsonb default '{}'::jsonb,

  -- Timestamps
  sent_at timestamptz,
  failed_at timestamptz,
  created_at timestamptz default now() not null,

  -- Constraints
  constraint recipient_not_empty check (length(trim(recipient)) > 0)
);

-- =========================================================
-- PAYMENT REMINDERS (for suspended users)
-- =========================================================
create table payment_reminders (
  id uuid primary key default gen_random_uuid(),

  -- Relations
  user_id uuid not null references profiles(id) on delete cascade,
  order_id uuid not null references orders(id) on delete cascade,

  -- Reminder
  sent_via notification_channel not null,

  -- Timestamps
  sent_at timestamptz default now() not null,

  -- Tracking
  clicked_at timestamptz
);

-- =========================================================
-- INDEXES (PERFORMANCE OPTIMIZATION)
-- =========================================================

-- Profiles
create index idx_profiles_status on profiles(status);
create index idx_profiles_stripe_customer_id on profiles(stripe_customer_id) where stripe_customer_id is not null;

-- Agents
create index idx_agents_active on agents(active) where active = true;

-- Products
create index idx_products_code on products(code);
create index idx_products_active on products(active) where active = true;
create index idx_products_dossier_type on products(dossier_type);

-- Product Steps
create index idx_product_steps_product_id on product_steps(product_id);
create index idx_product_steps_step_id on product_steps(step_id);

-- Steps
create index idx_steps_code on steps(code);
create index idx_steps_position on steps(position);

-- Step Document Types
create index idx_step_document_types_step_id on step_document_types(step_id);
create index idx_step_document_types_document_type on step_document_types(document_type_id);

-- Document Types
create index idx_document_types_code on document_types(code);
create index idx_document_types_required_step_id on document_types(required_step_id);

-- Step Fields
create index idx_step_fields_step_id on step_fields(step_id);
create index idx_step_fields_field_key on step_fields(field_key);
create index idx_step_fields_position on step_fields(step_id, position);

-- Step Field Values
create index idx_step_field_values_step_instance_id on step_field_values(step_instance_id);
create index idx_step_field_values_step_field_id on step_field_values(step_field_id);
create index idx_step_field_values_created_by on step_field_values(created_by_type, created_by_id);

-- Payment Links
create index idx_payment_links_token on payment_links(token);
create index idx_payment_links_prospect_email on payment_links(prospect_email);
create index idx_payment_links_product_id on payment_links(product_id);
create index idx_payment_links_used_at on payment_links(used_at);

-- Dossiers
create index idx_dossiers_user_id on dossiers(user_id);
create index idx_dossiers_product_id on dossiers(product_id);
create index idx_dossiers_type on dossiers(type);
create index idx_dossiers_status on dossiers(status);
create index idx_dossiers_current_step_instance_id on dossiers(current_step_instance_id);
create index idx_dossiers_created_at on dossiers(created_at desc);

-- Dossier Status History
create index idx_dossier_status_history_dossier_id on dossier_status_history(dossier_id);
create index idx_dossier_status_history_created_at on dossier_status_history(created_at desc);

-- Step Instances
create index idx_step_instances_dossier_id on step_instances(dossier_id);
create index idx_step_instances_step_id on step_instances(step_id);
create index idx_step_instances_assigned_to on step_instances(assigned_to);

-- Documents
create index idx_documents_dossier_id on documents(dossier_id);
create index idx_documents_document_type_id on documents(document_type_id);
create index idx_documents_status on documents(status);
create index idx_documents_step_instance_id on documents(step_instance_id);

-- Document Versions
create index idx_document_versions_document_id on document_versions(document_id);
create index idx_document_versions_uploaded_at on document_versions(uploaded_at desc);

-- Document Reviews
create index idx_document_reviews_document_version_id on document_reviews(document_version_id);
create index idx_document_reviews_reviewer_id on document_reviews(reviewer_id);
create index idx_document_reviews_status on document_reviews(status);

-- Orders
create index idx_orders_user_id on orders(user_id);
create index idx_orders_product_id on orders(product_id);
create index idx_orders_status on orders(status);
create index idx_orders_payment_link_id on orders(payment_link_id);
create index idx_orders_dossier_id on orders(dossier_id);
create index idx_orders_stripe_checkout_session_id on orders(stripe_checkout_session_id);
create index idx_orders_stripe_payment_intent_id on orders(stripe_payment_intent_id);
create index idx_orders_created_at on orders(created_at desc);

-- Messages
create index idx_messages_dossier_id on messages(dossier_id);
create index idx_messages_sender on messages(sender_type, sender_id);
create index idx_messages_created_at on messages(created_at desc);

-- Events
create index idx_events_entity on events(entity_type, entity_id);
create index idx_events_event_type on events(event_type);
create index idx_events_actor on events(actor_type, actor_id);
create index idx_events_created_at on events(created_at desc);

-- Notifications
create index idx_notifications_user_id on notifications(user_id);
create index idx_notifications_dossier_id on notifications(dossier_id);
create index idx_notifications_read_at on notifications(read_at);
create index idx_notifications_created_at on notifications(created_at desc);

-- Notification Deliveries
create index idx_notification_deliveries_notification_id on notification_deliveries(notification_id);
create index idx_notification_deliveries_channel on notification_deliveries(channel);
create index idx_notification_deliveries_status on notification_deliveries(status);

-- Payment Reminders
create index idx_payment_reminders_user_id on payment_reminders(user_id);
create index idx_payment_reminders_order_id on payment_reminders(order_id);

-- =========================================================
-- TRIGGERS (AUTO-UPDATE TIMESTAMPS)
-- =========================================================

-- Function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply to tables with updated_at
create trigger update_profiles_updated_at before update on profiles
  for each row execute function update_updated_at_column();

create trigger update_agents_updated_at before update on agents
  for each row execute function update_updated_at_column();

create trigger update_products_updated_at before update on products
  for each row execute function update_updated_at_column();

create trigger update_document_types_updated_at before update on document_types
  for each row execute function update_updated_at_column();

create trigger update_step_fields_updated_at before update on step_fields
  for each row execute function update_updated_at_column();

create trigger update_step_field_values_updated_at before update on step_field_values
  for each row execute function update_updated_at_column();

create trigger update_dossiers_updated_at before update on dossiers
  for each row execute function update_updated_at_column();

create trigger update_documents_updated_at before update on documents
  for each row execute function update_updated_at_column();

create trigger update_orders_updated_at before update on orders
  for each row execute function update_updated_at_column();

-- =========================================================
-- TRIGGERS (AUTO-CREATE EVENTS)
-- =========================================================

-- Function to create event on dossier status change
create or replace function create_dossier_status_event()
returns trigger as $$
begin
  if old.status is distinct from new.status then
    insert into events (entity_type, entity_id, event_type, payload)
    values (
      'dossier',
      new.id,
      'DOSSIER_STATUS_CHANGED',
      jsonb_build_object(
        'old_status', old.status,
        'new_status', new.status,
        'dossier_type', new.type
      )
    );

    -- Also insert into status history
    insert into dossier_status_history (dossier_id, old_status, new_status)
    values (new.id, old.status, new.status);
  end if;

  return new;
end;
$$ language plpgsql;

create trigger dossier_status_changed after update on dossiers
  for each row execute function create_dossier_status_event();

-- Function to create event on document upload
create or replace function create_document_upload_event()
returns trigger as $$
declare
  v_dossier_id uuid;
begin
  select dossier_id into v_dossier_id from documents where id = new.document_id;

  insert into events (entity_type, entity_id, event_type, payload)
  values (
    'document',
    new.document_id,
    'DOCUMENT_UPLOADED',
    jsonb_build_object(
      'version_id', new.id,
      'version_number', new.version_number,
      'file_name', new.file_name,
      'dossier_id', v_dossier_id,
      'uploaded_by_type', new.uploaded_by_type,
      'uploaded_by_id', new.uploaded_by_id
    )
  );

  return new;
end;
$$ language plpgsql;

create trigger document_version_created after insert on document_versions
  for each row execute function create_document_upload_event();

-- =========================================================
-- ROW LEVEL SECURITY (RLS)
-- =========================================================

-- Enable RLS on all user-facing tables
alter table profiles enable row level security;
alter table step_document_types enable row level security;
alter table dossiers enable row level security;
alter table step_instances enable row level security;
alter table step_field_values enable row level security;
alter table documents enable row level security;
alter table document_versions enable row level security;
alter table document_reviews enable row level security;
alter table orders enable row level security;
alter table messages enable row level security;
alter table events enable row level security;
alter table notifications enable row level security;
alter table notification_deliveries enable row level security;
alter table payment_reminders enable row level security;

-- Profiles: Users can only see and update their own profile
create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

-- Step Document Types: Admins can manage, authenticated users can view
create policy "Admins can manage step document types"
  on step_document_types
  for all
  to authenticated
  using (
    exists (
      select 1 from agents
      where agents.id = auth.uid()
      and agents.active = true
    )
  );

create policy "Authenticated users can view step document types"
  on step_document_types
  for select
  to authenticated
  using (true);

-- Dossiers: Users can only see their own dossiers
create policy "Users can view own dossiers"
  on dossiers for select
  using (auth.uid() = user_id);

-- Step Instances: Users can see steps for their dossiers
create policy "Users can view own dossier steps"
  on step_instances for select
  using (
    exists (
      select 1 from dossiers
      where dossiers.id = step_instances.dossier_id
      and dossiers.user_id = auth.uid()
    )
  );

-- Step Field Values: Users can view field values for their dossier steps
create policy "Users can view own step field values"
  on step_field_values for select
  using (
    exists (
      select 1 from step_instances
      join dossiers on dossiers.id = step_instances.dossier_id
      where step_instances.id = step_field_values.step_instance_id
      and dossiers.user_id = auth.uid()
    )
  );

-- Users can create/update field values for their dossier steps
create policy "Users can manage own step field values"
  on step_field_values for insert
  with check (
    exists (
      select 1 from step_instances
      join dossiers on dossiers.id = step_instances.dossier_id
      where step_instances.id = step_field_values.step_instance_id
      and dossiers.user_id = auth.uid()
    )
    and created_by_type = 'USER'
    and created_by_id = auth.uid()
  );

create policy "Users can update own step field values"
  on step_field_values for update
  using (
    exists (
      select 1 from step_instances
      join dossiers on dossiers.id = step_instances.dossier_id
      where step_instances.id = step_field_values.step_instance_id
      and dossiers.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from step_instances
      join dossiers on dossiers.id = step_instances.dossier_id
      where step_instances.id = step_field_values.step_instance_id
      and dossiers.user_id = auth.uid()
    )
  );

-- Documents: Users can see documents for their dossiers
create policy "Users can view own dossier documents"
  on documents for select
  using (
    exists (
      select 1 from dossiers
      where dossiers.id = documents.dossier_id
      and dossiers.user_id = auth.uid()
    )
  );

-- Users can upload documents for their dossiers
create policy "Users can upload documents"
  on documents for insert
  with check (
    exists (
      select 1 from dossiers
      where dossiers.id = documents.dossier_id
      and dossiers.user_id = auth.uid()
    )
  );

-- Document Versions: Users can see versions for their documents
create policy "Users can view own document versions"
  on document_versions for select
  using (
    exists (
      select 1 from documents
      join dossiers on dossiers.id = documents.dossier_id
      where documents.id = document_versions.document_id
      and dossiers.user_id = auth.uid()
    )
  );

-- Users can create new versions
create policy "Users can create document versions"
  on document_versions for insert
  with check (
    exists (
      select 1 from documents
      join dossiers on dossiers.id = documents.dossier_id
      where documents.id = document_versions.document_id
      and dossiers.user_id = auth.uid()
    )
  );

-- Document Reviews: Users can see reviews for their documents (read-only)
create policy "Users can view document reviews"
  on document_reviews for select
  using (
    exists (
      select 1 from document_versions
      join documents on documents.id = document_versions.document_id
      join dossiers on dossiers.id = documents.dossier_id
      where document_versions.id = document_reviews.document_version_id
      and dossiers.user_id = auth.uid()
    )
  );

-- Orders: Users can see their own orders
create policy "Users can view own orders"
  on orders for select
  using (auth.uid() = user_id);

-- Messages: Users can see messages for their dossiers
create policy "Users can view dossier messages"
  on messages for select
  using (
    exists (
      select 1 from dossiers
      where dossiers.id = messages.dossier_id
      and dossiers.user_id = auth.uid()
    )
  );

-- Users can send messages for their dossiers
create policy "Users can send messages"
  on messages for insert
  with check (
    exists (
      select 1 from dossiers
      where dossiers.id = messages.dossier_id
      and dossiers.user_id = auth.uid()
    )
    and sender_type = 'USER'
    and sender_id = auth.uid()
  );

-- Events: Users can see events for their dossiers
create policy "Users can view dossier events"
  on events for select
  using (
    entity_type = 'dossier' and exists (
      select 1 from dossiers
      where dossiers.id = events.entity_id::uuid
      and dossiers.user_id = auth.uid()
    )
  );

-- Notifications: Users can see their own notifications
create policy "Users can view own notifications"
  on notifications for select
  using (auth.uid() = user_id);

-- Users can mark notifications as read
create policy "Users can update own notifications"
  on notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Notification Deliveries: Users can see deliveries for their notifications
create policy "Users can view own notification deliveries"
  on notification_deliveries for select
  using (
    exists (
      select 1 from notifications
      where notifications.id = notification_deliveries.notification_id
      and notifications.user_id = auth.uid()
    )
  );

-- Payment Reminders: Users can see their own reminders
create policy "Users can view own payment reminders"
  on payment_reminders for select
  using (auth.uid() = user_id);

-- =========================================================
-- UTILITY FUNCTIONS
-- =========================================================

-- Function to get next step for a dossier based on product workflow
create or replace function get_next_step_for_dossier(p_dossier_id uuid)
returns uuid as $$
declare
  v_product_id uuid;
  v_current_position int;
  v_next_step_id uuid;
begin
  -- Get product and current step position
  select
    d.product_id,
    ps.position
  into v_product_id, v_current_position
  from dossiers d
  left join step_instances si on si.id = d.current_step_instance_id
  left join product_steps ps on ps.step_id = si.step_id and ps.product_id = d.product_id
  where d.id = p_dossier_id;

  -- Get next step
  select ps.step_id into v_next_step_id
  from product_steps ps
  where ps.product_id = v_product_id
  and ps.position > coalesce(v_current_position, -1)
  order by ps.position
  limit 1;

  return v_next_step_id;
end;
$$ language plpgsql;

-- Function to check if all required documents are uploaded for a step
create or replace function are_step_documents_complete(p_step_instance_id uuid)
returns boolean as $$
declare
  v_missing_count int;
begin
  select count(*)
  into v_missing_count
  from document_types dt
  join step_instances si on si.step_id = dt.required_step_id
  where si.id = p_step_instance_id
  and not exists (
    select 1 from documents d
    where d.step_instance_id = si.id
    and d.document_type_id = dt.id
    and d.status = 'APPROVED'
  );

  return v_missing_count = 0;
end;
$$ language plpgsql;

-- Function to generate unique payment link token
create or replace function generate_payment_link_token()
returns text as $$
begin
  return encode(gen_random_bytes(16), 'hex');
end;
$$ language plpgsql;

-- =========================================================
-- COMMENTS (DOCUMENTATION)
-- =========================================================

comment on table profiles is 'User profiles linked to Supabase auth.users';
comment on table agents is 'Internal agents/admins who manage dossiers';
comment on table products is 'Services/products that clients can purchase';
comment on table steps is 'Workflow step definitions';
comment on table product_steps is 'Defines which steps belong to which products';
comment on table step_document_types is 'Maps document types to workflow steps (shared across all products using the same step)';
comment on table document_types is 'Types of documents that can be uploaded';
comment on table step_fields is 'Custom form fields configuration for each step';
comment on table step_field_values is 'User-submitted values for custom step fields';
comment on table payment_links is 'Unique payment links generated by admins for prospects';
comment on table dossiers is 'Client dossiers (one per purchased product)';
comment on table dossier_status_history is 'Audit trail of all dossier status changes';
comment on table step_instances is 'Instances of steps being executed for a specific dossier';
comment on table documents is 'Documents uploaded for dossiers';
comment on table document_versions is 'Version history of documents';
comment on table document_reviews is 'Reviews of document versions by agents';
comment on table orders is 'Purchase orders linked to Stripe payments';
comment on table messages is 'Communication between users and agents';
comment on table events is 'Event log for event-driven architecture';
comment on table notifications is 'Logical notifications to be sent to users';
comment on table notification_deliveries is 'Multi-channel delivery tracking for notifications';
comment on table payment_reminders is 'Payment reminders sent to suspended users';

-- =========================================================
-- END OF SCHEMA
-- =========================================================
