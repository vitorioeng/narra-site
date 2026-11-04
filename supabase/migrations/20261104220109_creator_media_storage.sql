/*
# Creator media: storage buckets, per-user upload rules and profile media columns

1. Storage buckets (all public, so saved URLs can be shown to anyone)
- `avatars`: profile photos. Images only (JPEG, PNG, WebP), up to 2 MB.
- `banners`: cover images for creator cards. Images only, up to 5 MB.
- `demos`: audio or video demonstrations. Common audio and video formats, up to 50 MB.

2. Storage security
- Signed-in users can upload, replace, read and delete only files inside their own folder
  (the folder name must equal their user id, e.g. `avatars/<user_id>/avatar.png`).
- Anonymous visitors can view files through the public links but cannot change them.

3. Creators table
- New columns `avatar_url`, `banner_url` and `demo_url` store the public link of each file.
  They are left empty until the owner uploads something; the app then shows its default image.
- Only the creator owner can write these columns, through the existing owner-only update rule.
- Each link must point to the matching bucket, so the marketplace cannot be filled with arbitrary links.

4. Notes
- Profile media lives on the creator listing rather than on the private profiles table, because
  the marketplace feed is public and profiles are readable only by their own user.
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('banners', 'banners', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('demos', 'demos', true, 52428800, ARRAY['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg', 'audio/webm', 'video/mp4', 'video/webm'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "creator_media_select_own" ON storage.objects;
CREATE POLICY "creator_media_select_own" ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id IN ('avatars', 'banners', 'demos') AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "creator_media_insert_own" ON storage.objects;
CREATE POLICY "creator_media_insert_own" ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id IN ('avatars', 'banners', 'demos') AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "creator_media_update_own" ON storage.objects;
CREATE POLICY "creator_media_update_own" ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id IN ('avatars', 'banners', 'demos') AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id IN ('avatars', 'banners', 'demos') AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "creator_media_delete_own" ON storage.objects;
CREATE POLICY "creator_media_delete_own" ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id IN ('avatars', 'banners', 'demos') AND (storage.foldername(name))[1] = auth.uid()::text);

ALTER TABLE creators ADD COLUMN IF NOT EXISTS avatar_url text
  CHECK (avatar_url IS NULL OR avatar_url LIKE '%/storage/v1/object/public/avatars/%');
ALTER TABLE creators ADD COLUMN IF NOT EXISTS banner_url text
  CHECK (banner_url IS NULL OR banner_url LIKE '%/storage/v1/object/public/banners/%');
ALTER TABLE creators ADD COLUMN IF NOT EXISTS demo_url text
  CHECK (demo_url IS NULL OR demo_url LIKE '%/storage/v1/object/public/demos/%');

GRANT UPDATE (avatar_url, banner_url, demo_url) ON creators TO authenticated;
