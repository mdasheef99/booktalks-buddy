-- Rollback script for club photos schema
-- Use only if rollback is necessary
-- WARNING: This will remove photo data permanently

-- =========================
-- Remove RLS Policies
-- =========================

-- Drop storage RLS policies
DROP POLICY IF EXISTS "Club leads can upload photos" ON storage.objects;
DROP POLICY IF EXISTS "Club leads can update photos" ON storage.objects;
DROP POLICY IF EXISTS "Club leads can delete photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view club photos" ON storage.objects;

-- =========================
-- Remove View
-- =========================

-- Drop member count view
DROP VIEW IF EXISTS club_with_member_count;

-- =========================
-- Remove Indexes
-- =========================

-- Drop performance indexes
DROP INDEX IF EXISTS idx_book_clubs_cover_photo;
DROP INDEX IF EXISTS idx_book_clubs_photo_member_lookup;

-- =========================
-- Remove Columns (DANGEROUS - Will delete photo data)
-- =========================

-- WARNING: Uncomment these lines only if you want to permanently delete photo data
-- ALTER TABLE book_clubs DROP COLUMN IF EXISTS cover_photo_url;
-- ALTER TABLE book_clubs DROP COLUMN IF EXISTS cover_photo_thumbnail_url;
-- ALTER TABLE book_clubs DROP COLUMN IF EXISTS cover_photo_updated_at;

-- =========================
-- Remove Storage Bucket (DANGEROUS - Will delete all photos)
-- =========================

-- WARNING: Uncomment this line only if you want to permanently delete all club photos
-- DELETE FROM storage.buckets WHERE id = 'club-photos';

-- =========================
-- Verification
-- =========================

DO $$
BEGIN
  RAISE NOTICE 'Club Photos Schema Rollback completed!';
  RAISE NOTICE 'NOTE: Photo columns and storage bucket were NOT removed to prevent data loss';
  RAISE NOTICE 'To completely remove photo data, uncomment the dangerous sections in this script';
END $$;
