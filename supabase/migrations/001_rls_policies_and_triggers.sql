-- =========================================================
-- ADDITIONAL TRIGGERS AND RLS POLICIES
-- =========================================================
-- This file contains:
-- 1. Trigger for profile status changes
-- 2. RLS policies for AGENT role
-- 3. Seed data for development
-- =========================================================

-- =========================================================
-- TRIGGER: Profile Status Change Event
-- =========================================================

-- Function to create event on profile status change
create or replace function on_profile_status_change()
returns trigger as $$
begin
  if old.status is distinct from new.status then
    insert into events (entity_type, entity_id, event_type, actor_type, actor_id, payload)
    values (
      'profile',
      new.id,
      'DOSSIER_STATUS_CHANGED',  -- Using existing event type, could add PROFILE_STATUS_CHANGED if needed
      'SYSTEM',
      null,
      jsonb_build_object(
        'old_status', old.status,
        'new_status', new.status,
        'profile_id', new.id
      )
    );
  end if;

  return new;
end;
$$ language plpgsql;

create trigger profile_status_changed after update on profiles
  for each row execute function on_profile_status_change();

-- =========================================================
-- RLS POLICIES FOR AGENT ROLE
-- =========================================================

-- Helper function to check if user is an agent
create or replace function is_agent(user_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from agents
    where agents.id = user_id
    and agents.active = true
  );
end;
$$ language plpgsql security definer;

-- Profiles: Agents can view all profiles
create policy "Agents can view all profiles"
  on profiles for select
  using (is_agent(auth.uid()));

-- Agents can update profile status
create policy "Agents can update profile status"
  on profiles for update
  using (is_agent(auth.uid()))
  with check (is_agent(auth.uid()));

-- Dossiers: Agents can view all dossiers
create policy "Agents can view all dossiers"
  on dossiers for select
  using (is_agent(auth.uid()));

-- Agents can update dossiers
create policy "Agents can update dossiers"
  on dossiers for update
  using (is_agent(auth.uid()))
  with check (is_agent(auth.uid()));

-- Step Instances: Agents can view all step instances
create policy "Agents can view all step instances"
  on step_instances for select
  using (is_agent(auth.uid()));

-- Agents can update step instances (assign, complete)
create policy "Agents can update step instances"
  on step_instances for update
  using (is_agent(auth.uid()))
  with check (is_agent(auth.uid()));

-- Step Field Values: Agents can view all field values
create policy "Agents can view all step field values"
  on step_field_values for select
  using (is_agent(auth.uid()));

-- Documents: Agents can view all documents
create policy "Agents can view all documents"
  on documents for select
  using (is_agent(auth.uid()));

-- Agents can update document status
create policy "Agents can update documents"
  on documents for update
  using (is_agent(auth.uid()))
  with check (is_agent(auth.uid()));

-- Document Versions: Agents can view all versions
create policy "Agents can view all document versions"
  on document_versions for select
  using (is_agent(auth.uid()));

-- Document Reviews: Agents can create reviews
create policy "Agents can create document reviews"
  on document_reviews for insert
  with check (is_agent(auth.uid()) and reviewer_id = auth.uid());

-- Agents can view all reviews
create policy "Agents can view all document reviews"
  on document_reviews for select
  using (is_agent(auth.uid()));

-- Messages: Agents can view all messages
create policy "Agents can view all messages"
  on messages for select
  using (is_agent(auth.uid()));

-- Agents can send messages
create policy "Agents can send messages"
  on messages for insert
  with check (
    is_agent(auth.uid())
    and sender_type = 'AGENT'
    and sender_id = auth.uid()
  );

-- Events: Agents can view all events
create policy "Agents can view all events"
  on events for select
  using (is_agent(auth.uid()));

-- Notifications: Agents can view all notifications (for debugging)
create policy "Agents can view all notifications"
  on notifications for select
  using (is_agent(auth.uid()));

-- Orders: Agents can view all orders
create policy "Agents can view all orders"
  on orders for select
  using (is_agent(auth.uid()));

-- =========================================================
-- SEED DATA FOR DEVELOPMENT
-- =========================================================

-- Insert sample products
insert into products (code, name, description, dossier_type, price_amount, currency, initial_status, active)
values
  (
    'LLC_FORMATION',
    'Formation LLC',
    'Service complet de formation d''une LLC aux États-Unis',
    'LLC',
    99900,  -- $999.00
    'USD',
    'QUALIFICATION',
    true
  ),
  (
    'DUBAI_SETUP',
    'Dubai Company Setup',
    'Création d''entreprise à Dubai avec tous les services nécessaires',
    'DUBAI',
    149900,  -- $1499.00
    'USD',
    'QUALIFICATION',
    true
  )
on conflict (code) do nothing;

-- Insert workflow steps
insert into steps (code, label, description, position)
values
  ('QUALIFICATION', 'Qualification', 'Étape initiale de qualification du client', 0),
  ('FORM_SUBMISSION', 'Soumission du formulaire', 'Le client remplit le formulaire initial', 1),
  ('DOCUMENT_COLLECTION', 'Collecte de documents', 'Collecte de tous les documents requis', 2),
  ('REVIEW', 'Révision', 'Révision des documents par un agent', 3),
  ('COMPLETION', 'Finalisation', 'Finalisation et livraison du service', 4)
on conflict (code) do nothing;

-- Link steps to products
insert into product_steps (product_id, step_id, position, is_required, estimated_duration_hours)
select
  p.id,
  s.id,
  s.position,
  true,
  case s.position
    when 0 then 1
    when 1 then 24
    when 2 then 48
    when 3 then 72
    when 4 then 24
    else null
  end
from products p
cross join steps s
where p.code in ('LLC_FORMATION', 'DUBAI_SETUP')
on conflict (product_id, step_id) do nothing;

-- Insert document types
insert into document_types (code, label, description, required_step_id, max_file_size_mb, allowed_extensions)
select
  dt.code,
  dt.label,
  dt.description,
  s.id,
  dt.max_file_size_mb,
  dt.allowed_extensions
from (values
  ('PASSPORT', 'Passeport', 'Copie du passeport', 'DOCUMENT_COLLECTION', 5, array['pdf', 'jpg', 'png']::text[]),
  ('PROOF_ADDRESS', 'Justificatif de domicile', 'Facture ou relevé bancaire récent', 'DOCUMENT_COLLECTION', 5, array['pdf', 'jpg', 'png']::text[]),
  ('IDENTITY_DOC', 'Pièce d''identité', 'Carte d''identité nationale', 'DOCUMENT_COLLECTION', 5, array['pdf', 'jpg', 'png']::text[])
) as dt(code, label, description, step_code, max_file_size_mb, allowed_extensions)
join steps s on s.code = dt.step_code
on conflict (code) do nothing;
