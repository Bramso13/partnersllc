-- =========================================================
-- FORMATIONS SCHEMA
-- Story 12.1: Formations - Backend & modèle de données
-- =========================================================
-- This migration creates the database schema for the formations
-- (training courses) system with video/image/text content and
-- user progress tracking.
-- =========================================================

-- =========================================================
-- TABLE: formations
-- =========================================================
-- Stores training courses with visibility rules
create table if not exists formations (
  id uuid primary key default gen_random_uuid(),
  titre text not null,
  description text,
  vignette_url text,
  vignette_path text,

  -- Visibility configuration
  -- visibility_type: 'all' | 'by_product_ids' | 'by_dossier_type'
  visibility_type text not null default 'all',
  -- visibility_config: JSONB containing product_ids array or dossier_type string
  -- Examples:
  --   { "product_ids": ["uuid1", "uuid2"] }
  --   { "dossier_type": "SARL" }
  visibility_config jsonb default '{}'::jsonb,

  -- Display order for listing
  display_order integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for ordering
create index idx_formations_display_order on formations(display_order);

-- Index for visibility type
create index idx_formations_visibility_type on formations(visibility_type);

comment on table formations is 'Training courses with video/image/text content';
comment on column formations.titre is 'Formation title';
comment on column formations.description is 'Formation description (text)';
comment on column formations.vignette_url is 'Thumbnail URL (external)';
comment on column formations.vignette_path is 'Thumbnail storage path (Supabase Storage)';
comment on column formations.visibility_type is 'Who can see this formation: all, by_product_ids, by_dossier_type';
comment on column formations.visibility_config is 'JSON config for visibility rules (product_ids or dossier_type)';
comment on column formations.display_order is 'Order for displaying formations in list';

-- =========================================================
-- TABLE: formation_elements
-- =========================================================
-- Stores individual elements (steps) in a formation
create table if not exists formation_elements (
  id uuid primary key default gen_random_uuid(),
  formation_id uuid not null references formations(id) on delete cascade,

  -- Element type
  -- 'video_link' | 'video_upload' | 'image' | 'rich_text'
  type text not null check (type in ('video_link', 'video_upload', 'image', 'rich_text')),

  -- Position in the course (starts at 1)
  position integer not null,

  -- Type-specific data
  -- video_link: { "url": "https://youtube.com/..." }
  -- video_upload: { "storage_path": "formation-videos/xxx.mp4" }
  -- image: { "url": "..." } or { "storage_path": "formation-images/xxx.jpg" }
  -- rich_text: { "content": "HTML or markdown content" }
  payload jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),

  -- Ensure unique position per formation
  constraint formation_elements_unique_position unique (formation_id, position)
);

-- Index for fetching elements in order
create index idx_formation_elements_formation_position on formation_elements(formation_id, position);

comment on table formation_elements is 'Individual content elements (videos, images, text) in a formation';
comment on column formation_elements.type is 'Element type: video_link, video_upload, image, or rich_text';
comment on column formation_elements.position is 'Position/order in the formation (1-indexed)';
comment on column formation_elements.payload is 'Type-specific JSON data (url, storage_path, or content)';

-- =========================================================
-- TABLE: user_formation_progress
-- =========================================================
-- Tracks user progress through formations
create table if not exists user_formation_progress (
  user_id uuid not null references profiles(id) on delete cascade,
  formation_id uuid not null references formations(id) on delete cascade,

  -- Last element viewed
  last_element_id uuid references formation_elements(id) on delete set null,

  -- Array of completed element IDs
  completed_element_ids jsonb not null default '[]'::jsonb,

  updated_at timestamptz not null default now(),

  -- Ensure one progress record per user per formation
  primary key (user_id, formation_id)
);

-- Index for user's progress queries
create index idx_user_formation_progress_user on user_formation_progress(user_id);

-- Index for formation analytics
create index idx_user_formation_progress_formation on user_formation_progress(formation_id);

comment on table user_formation_progress is 'User progress tracking for formations (resume and completion)';
comment on column user_formation_progress.last_element_id is 'Last element the user viewed (for resume functionality)';
comment on column user_formation_progress.completed_element_ids is 'JSON array of element IDs the user has marked as complete';
comment on column user_formation_progress.updated_at is 'Last time progress was updated';

-- =========================================================
-- TRIGGER: Auto-update updated_at
-- =========================================================
create or replace function update_formations_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger formations_updated_at
  before update on formations
  for each row
  execute function update_formations_updated_at();

create or replace function update_user_formation_progress_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger user_formation_progress_updated_at
  before update on user_formation_progress
  for each row
  execute function update_user_formation_progress_updated_at();

-- =========================================================
-- RLS POLICIES
-- =========================================================
-- Enable RLS on all tables
alter table formations enable row level security;
alter table formation_elements enable row level security;
alter table user_formation_progress enable row level security;

-- Admin can do everything
create policy "Admins can manage formations"
  on formations for all
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'ADMIN'
    )
  );

create policy "Admins can manage formation elements"
  on formation_elements for all
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'ADMIN'
    )
  );

-- Note: User access to formations and progress is controlled via API
-- No direct RLS policies for clients - they must use API endpoints
-- that enforce visibility rules

comment on policy "Admins can manage formations" on formations is 'Allow admins full access to formations';
comment on policy "Admins can manage formation elements" on formation_elements is 'Allow admins full access to formation elements';

-- =========================================================
-- SUCCESS MESSAGE
-- =========================================================
do $$
begin
  raise notice '✓ Formations schema created successfully';
  raise notice '  - formations table (with visibility rules)';
  raise notice '  - formation_elements table (video/image/text)';
  raise notice '  - user_formation_progress table (tracking)';
  raise notice '  - RLS policies enabled (admin access only)';
end $$;
