-- =========================================================
-- EVENT-DRIVEN ARCHITECTURE TRIGGERS
-- Story 3.1: Event-Driven Architecture Foundation
-- =========================================================
-- This migration:
-- 1. Improves existing triggers to include actor_type and actor_id
-- 2. Adds trigger for document review events
-- 3. Adds immutability constraint on events table
-- =========================================================

-- =========================================================
-- IMMUTABILITY CONSTRAINT ON EVENTS
-- =========================================================
-- Events are immutable - no UPDATE or DELETE allowed
-- This is enforced via RLS policies (see migration 012)

-- =========================================================
-- IMPROVED TRIGGER: Dossier Status Change
-- =========================================================
-- Update existing trigger to include actor_type and actor_id
create or replace function create_dossier_status_event()
returns trigger as $$
declare
  v_actor_type actor_type;
  v_actor_id uuid;
begin
  if old.status is distinct from new.status then
    -- Try to get actor from auth context
    -- If auth.uid() is available and matches a user, use USER
    -- Otherwise, default to SYSTEM
    if auth.uid() is not null then
      -- Check if it's a user (profile)
      if exists (select 1 from profiles where id = auth.uid()) then
        v_actor_type := 'USER';
        v_actor_id := auth.uid();
      -- Check if it's an agent
      elsif exists (select 1 from agents where id = auth.uid()) then
        v_actor_type := 'AGENT';
        v_actor_id := auth.uid();
      else
        v_actor_type := 'SYSTEM';
        v_actor_id := null;
      end if;
    else
      v_actor_type := 'SYSTEM';
      v_actor_id := null;
    end if;

    insert into events (
      entity_type,
      entity_id,
      event_type,
      actor_type,
      actor_id,
      payload
    )
    values (
      'dossier',
      new.id,
      'DOSSIER_STATUS_CHANGED',
      v_actor_type,
      v_actor_id,
      jsonb_build_object(
        'old_status', old.status,
        'new_status', new.status,
        'dossier_type', new.type,
        'dossier_id', new.id
      )
    );

    -- Also insert into status history (if not already exists)
    if not exists (
      select 1 from dossier_status_history
      where dossier_id = new.id
      and old_status = old.status
      and new_status = new.status
      and created_at > now() - interval '1 second'
    ) then
      insert into dossier_status_history (
        dossier_id,
        old_status,
        new_status,
        changed_by_type,
        changed_by_id
      )
      values (
        new.id,
        old.status,
        new.status,
        v_actor_type,
        v_actor_id
      );
    end if;
  end if;

  return new;
end;
$$ language plpgsql security definer;

-- =========================================================
-- IMPROVED TRIGGER: Document Upload
-- =========================================================
-- Update existing trigger to include actor_type and actor_id from uploaded_by fields
create or replace function create_document_upload_event()
returns trigger as $$
declare
  v_dossier_id uuid;
  v_actor_type actor_type;
  v_actor_id uuid;
begin
  -- Get dossier_id from document
  select dossier_id into v_dossier_id
  from documents
  where id = new.document_id;

  -- Use uploaded_by_type and uploaded_by_id from document_versions
  v_actor_type := new.uploaded_by_type;
  v_actor_id := new.uploaded_by_id;

  insert into events (
    entity_type,
    entity_id,
    event_type,
    actor_type,
    actor_id,
    payload
  )
  values (
    'document',
    new.document_id,
    'DOCUMENT_UPLOADED',
    v_actor_type,
    v_actor_id,
    jsonb_build_object(
      'version_id', new.id,
      'version_number', new.version_number,
      'file_name', new.file_name,
      'file_size_bytes', new.file_size_bytes,
      'mime_type', new.mime_type,
      'dossier_id', v_dossier_id,
      'uploaded_by_type', new.uploaded_by_type,
      'uploaded_by_id', new.uploaded_by_id,
      'uploaded_at', new.uploaded_at
    )
  );

  return new;
end;
$$ language plpgsql security definer;

-- =========================================================
-- NEW TRIGGER: Document Review
-- =========================================================
-- Create trigger for document review events
create or replace function create_document_review_event()
returns trigger as $$
declare
  v_document_id uuid;
  v_dossier_id uuid;
  v_document_type_id uuid;
  v_document_type_label text;
  v_reviewer_name text;
begin
  -- Get document_id from document_version
  select document_id into v_document_id
  from document_versions
  where id = new.document_version_id;

  -- Get dossier_id and document_type from document
  select d.dossier_id, d.document_type_id into v_dossier_id, v_document_type_id
  from documents d
  where d.id = v_document_id;

  -- Get document type label
  select label into v_document_type_label
  from document_types
  where id = v_document_type_id;

  -- Get reviewer name
  select name into v_reviewer_name
  from agents
  where id = new.reviewer_id;

  insert into events (
    entity_type,
    entity_id,
    event_type,
    actor_type,
    actor_id,
    payload
  )
  values (
    'document',
    v_document_id,
    'DOCUMENT_REVIEWED',
    'AGENT',
    new.reviewer_id,
    jsonb_build_object(
      'document_id', v_document_id,
      'document_version_id', new.document_version_id,
      'document_type_id', v_document_type_id,
      'document_type', v_document_type_label,
      'dossier_id', v_dossier_id,
      'reviewer_id', new.reviewer_id,
      'reviewer_name', v_reviewer_name,
      'review_status', new.status,
      'rejection_reason', new.reason,
      'notes', new.notes,
      'reviewed_at', new.reviewed_at
    )
  );

  return new;
end;
$$ language plpgsql security definer;

-- Create trigger on document_reviews table
create trigger document_review_created after insert on document_reviews
  for each row execute function create_document_review_event();

-- =========================================================
-- COMMENTS
-- =========================================================
comment on function create_dossier_status_event() is 'Creates DOSSIER_STATUS_CHANGED event when dossier status changes';
comment on function create_document_upload_event() is 'Creates DOCUMENT_UPLOADED event when a document version is uploaded';
comment on function create_document_review_event() is 'Creates DOCUMENT_REVIEWED event when a document is reviewed by an agent';
