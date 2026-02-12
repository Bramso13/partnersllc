-- =========================================================
-- Story 12.6: Formations – Titre sur tous les éléments + type custom_html
-- =========================================================
-- - Add column title (text, default 'No title yet') on formation_elements
-- - Extend type check to accept 'custom_html'
-- - Backfill existing rows with title = 'No title yet'
-- =========================================================

-- 1. Add title column with default
alter table formation_elements
  add column if not exists title text default 'No title yet';

comment on column formation_elements.title is 'Display title for the element (shown in parcours summary/nav). Default: No title yet';

-- 2. Backfill existing rows (in case default was not applied)
update formation_elements
set title = 'No title yet'
where title is null or title = '';

-- 3. Drop existing check constraint on type (name may vary; we use the one from 034)
alter table formation_elements
  drop constraint if exists formation_elements_type_check;

-- 4. Add new check constraint including custom_html
alter table formation_elements
  add constraint formation_elements_type_check
  check (type in ('video_link', 'video_upload', 'image', 'rich_text', 'custom_html'));

-- 5. Update comment
comment on column formation_elements.type is 'Element type: video_link, video_upload, image, rich_text, or custom_html';
