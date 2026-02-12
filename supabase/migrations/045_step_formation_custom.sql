-- =========================================================
-- STEP_FORMATION_CUSTOM (Story 12.5)
-- Custom HTML formation page per step (no link to formations table)
-- =========================================================

create table if not exists step_formation_custom (
  id uuid primary key default gen_random_uuid(),
  step_id uuid not null references steps(id) on delete cascade,
  position int not null default 0,
  title text not null,
  html_content text not null
);

create index idx_step_formation_custom_step_id on step_formation_custom(step_id);

comment on table step_formation_custom is 'Custom HTML formation pages for a workflow step (Story 12.5)';
comment on column step_formation_custom.position is 'Display order for this step';
comment on column step_formation_custom.html_content is 'HTML content (sanitized on display)';

-- RLS: admins full access; authenticated read (API filters by step access)
alter table step_formation_custom enable row level security;

create policy "Admins can manage step_formation_custom"
  on step_formation_custom for all
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.role = 'ADMIN'
    )
  );

create policy "Authenticated users can read step_formation_custom"
  on step_formation_custom for select
  using (auth.uid() is not null);
