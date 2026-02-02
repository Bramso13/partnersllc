-- =========================================================
-- STEP_FORMATIONS (Story 12.4)
-- Many-to-many: steps <-> formations (order by position)
-- =========================================================

create table if not exists step_formations (
  step_id uuid not null references steps(id) on delete cascade,
  formation_id uuid not null references formations(id) on delete cascade,
  position int not null default 0,
  primary key (step_id, formation_id)
);

create index idx_step_formations_step_id on step_formations(step_id);
create index idx_step_formations_formation_id on step_formations(formation_id);

comment on table step_formations is 'Formations recommended for a workflow step (many-to-many)';
comment on column step_formations.position is 'Display order of the formation for this step';

-- RLS: admins manage; authenticated users can read (API filters by formation visibility)
alter table step_formations enable row level security;

create policy "Admins can manage step_formations"
  on step_formations for all
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.role = 'ADMIN'
    )
  );

create policy "Authenticated users can read step_formations"
  on step_formations for select
  using (auth.uid() is not null);
