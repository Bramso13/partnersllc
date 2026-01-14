-- =========================================================
-- RLS POLICY: Users can create their own dossiers
-- =========================================================
-- This policy allows authenticated users to create dossiers
-- where they are the owner (user_id = auth.uid())
-- =========================================================

-- Users can create their own dossiers
create policy "Users can create own dossiers"
  on dossiers for insert
  with check (auth.uid() = user_id);

-- Users can update their own dossiers (for status changes during qualification)
create policy "Users can update own dossiers"
  on dossiers for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Users can create step instances for their own dossiers
create policy "Users can create own step instances"
  on step_instances for insert
  with check (
    exists (
      select 1 from dossiers
      where dossiers.id = step_instances.dossier_id
      and dossiers.user_id = auth.uid()
    )
  );
