# Supabase Storage Setup

This document describes the storage buckets required for the application.

## Existing Buckets

### `dossier-documents`
- **Purpose**: Store user-uploaded documents for dossiers
- **Access**: Private with RLS policies
- **Path pattern**: `{dossier_id}/{document_type_id}/{timestamp}.{ext}`

## Formations Storage Buckets (Story 12.1)

### `formation-videos`
- **Purpose**: Store uploaded training video files
- **Access**: Public read for authenticated users (or signed URLs)
- **Path pattern**: `{formation_id}/{element_id}/{filename}.{ext}`
- **File size limit**: 500MB per file (configurable)
- **Allowed formats**: mp4, webm, mov, avi

### `formation-images`
- **Purpose**: Store training images and rich text embedded images
- **Access**: Public read for authenticated users
- **Path pattern**: `{formation_id}/{element_id}/{filename}.{ext}` or `rich-text/{timestamp}_{filename}.{ext}`
- **File size limit**: 10MB per file
- **Allowed formats**: jpg, jpeg, png, gif, webp, svg

## Setup Instructions

### Via Supabase Dashboard

1. Go to **Storage** in your Supabase project dashboard
2. Click **New Bucket**
3. Configure each bucket:

#### For `formation-videos`:
```
Name: formation-videos
Public: Yes (or use RLS policies for finer control)
File size limit: 524288000 (500MB in bytes)
Allowed MIME types: video/mp4, video/webm, video/quicktime, video/x-msvideo
```

#### For `formation-images`:
```
Name: formation-images
Public: Yes
File size limit: 10485760 (10MB in bytes)
Allowed MIME types: image/jpeg, image/png, image/gif, image/webp, image/svg+xml
```

### Via Supabase CLI

```bash
# Create formation-videos bucket
supabase storage buckets create formation-videos \
  --public=true \
  --file-size-limit=524288000 \
  --allowed-mime-types=video/mp4,video/webm,video/quicktime,video/x-msvideo

# Create formation-images bucket
supabase storage buckets create formation-images \
  --public=true \
  --file-size-limit=10485760 \
  --allowed-mime-types=image/jpeg,image/png,image/gif,image/webp,image/svg+xml
```

### RLS Policies (Optional - for stricter access control)

If you want to use RLS instead of public access:

```sql
-- Policies for formation-videos
-- Allow admins to upload
create policy "Admins can upload formation videos"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'formation-videos' AND
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'ADMIN'
    )
  );

-- Allow authenticated users to read videos they have access to
create policy "Users can view accessible formation videos"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'formation-videos');

-- Allow admins to delete
create policy "Admins can delete formation videos"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'formation-videos' AND
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'ADMIN'
    )
  );

-- Similar policies for formation-images
create policy "Admins can upload formation images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'formation-images' AND
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'ADMIN'
    )
  );

create policy "Users can view formation images"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'formation-images');

create policy "Admins can delete formation images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'formation-images' AND
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'ADMIN'
    )
  );
```

## Usage in Application Code

### Upload Video

```typescript
import { createClient } from "@/lib/supabase/server";

const supabase = await createClient();
const file = formData.get("file") as File;

const fileName = `${formationId}/${elementId}/${Date.now()}.mp4`;

const { data, error } = await supabase.storage
  .from("formation-videos")
  .upload(fileName, file, {
    cacheControl: "3600",
    upsert: false,
  });

// Get public URL or signed URL
const { data: { publicUrl } } = supabase.storage
  .from("formation-videos")
  .getPublicUrl(fileName);
```

### Upload Image

```typescript
const fileName = `${formationId}/${elementId}/${Date.now()}.jpg`;

const { data, error } = await supabase.storage
  .from("formation-images")
  .upload(fileName, file);

const { data: { publicUrl } } = supabase.storage
  .from("formation-images")
  .getPublicUrl(fileName);
```

## Verification

After setup, verify buckets are created:

```bash
# Via CLI
supabase storage buckets list

# Expected output should include:
# - formation-videos
# - formation-images
```

## Notes

- Buckets are created in Supabase Dashboard or via CLI, not via SQL migrations
- Storage paths in `formation_elements.payload` should reference these buckets
- For video_link type, external URLs (YouTube, Vimeo) don't use storage
- For video_upload type, files are stored in `formation-videos` bucket
- For image type, files can be external URLs or stored in `formation-images` bucket
- Rich text images embedded in content should also use `formation-images` bucket
