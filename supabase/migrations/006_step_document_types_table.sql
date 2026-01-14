-- =========================================================
-- STEP DOCUMENT TYPES (many-to-many join table)
-- =========================================================
-- Maps which document types are required for which product steps
-- Allows flexible document requirements per workflow step

create table if not exists step_document_types (
  id uuid primary key default gen_random_uuid(),

  -- Relations
  product_step_id uuid not null references product_steps(id) on delete cascade,
  document_type_id uuid not null references document_types(id) on delete cascade,

  -- Timestamps
  created_at timestamptz default now() not null,

  -- Constraints
  unique(product_step_id, document_type_id)
);

-- Index for performance
create index if not exists idx_step_document_types_product_step
  on step_document_types(product_step_id);

create index if not exists idx_step_document_types_document_type
  on step_document_types(document_type_id);

-- RLS Policies
alter table step_document_types enable row level security;

-- Allow admins (agents) full access
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

-- Allow all authenticated users to read
create policy "Authenticated users can view step document types"
  on step_document_types
  for select
  to authenticated
  using (true);
