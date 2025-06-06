-- Book Club Photo Management Schema Migration
-- Phase 1: Database Foundation
-- Generated from architect mode specifications (91% confidence)

-- =========================
-- Add Photo Columns to book_clubs Table
-- =========================

-- Add photo-related columns (nullable for backward compatibility)
ALTER TABLE book_clubs 
ADD COLUMN IF NOT EXISTS cover_photo_url TEXT,
ADD COLUMN IF NOT EXISTS cover_photo_thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS cover_photo_updated_at TIMESTAMPTZ;

-- Add performance index for photo queries
CREATE INDEX IF NOT EXISTS idx_book_clubs_cover_photo 
ON book_clubs(cover_photo_url) 
WHERE cover_photo_url IS NOT NULL;

-- Add composite index for photo and member queries
CREATE INDEX IF NOT EXISTS idx_book_clubs_photo_member_lookup
ON book_clubs(id, cover_photo_url, lead_user_id)
WHERE cover_photo_url IS NOT NULL;

-- =========================
-- Create Member Count View for Performance
-- =========================

-- Optimized view for member count queries
CREATE OR REPLACE VIEW club_with_member_count AS
SELECT 
  bc.*,
  COALESCE(cm.member_count, 0) as member_count,
  COALESCE(cm.approved_member_count, 0) as approved_member_count
FROM book_clubs bc
LEFT JOIN (
  SELECT 
    club_id, 
    COUNT(*) as member_count,
    COUNT(*) FILTER (WHERE role IN ('admin', 'member')) as approved_member_count
  FROM club_members
  GROUP BY club_id
) cm ON bc.id = cm.club_id;

-- =========================
-- Create Storage Bucket
-- =========================

-- Club photos storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'club-photos',
  'club-photos',
  true,
  3145728, -- 3MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- =========================
-- Storage RLS Policies
-- =========================

-- Club leads can upload photos to their clubs
CREATE POLICY "Club leads can upload photos" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'club-photos' AND
  EXISTS (
    SELECT 1 FROM book_clubs
    WHERE id::text = (storage.foldername(name))[1]
    AND lead_user_id = auth.uid()
  )
);

-- Club leads can update their club photos
CREATE POLICY "Club leads can update photos" ON storage.objects
FOR UPDATE TO authenticated USING (
  bucket_id = 'club-photos' AND
  EXISTS (
    SELECT 1 FROM book_clubs
    WHERE id::text = (storage.foldername(name))[1]
    AND lead_user_id = auth.uid()
  )
);

-- Club leads can delete their club photos
CREATE POLICY "Club leads can delete photos" ON storage.objects
FOR DELETE TO authenticated USING (
  bucket_id = 'club-photos' AND
  EXISTS (
    SELECT 1 FROM book_clubs
    WHERE id::text = (storage.foldername(name))[1]
    AND lead_user_id = auth.uid()
  )
);

-- Public read access for all club photos
CREATE POLICY "Anyone can view club photos" ON storage.objects
FOR SELECT TO public USING (bucket_id = 'club-photos');

-- =========================
-- Comments for Documentation
-- =========================

COMMENT ON COLUMN book_clubs.cover_photo_url IS 'Main club photo URL (1200x800 optimized)';
COMMENT ON COLUMN book_clubs.cover_photo_thumbnail_url IS 'Thumbnail photo URL (300x200 optimized)';
COMMENT ON COLUMN book_clubs.cover_photo_updated_at IS 'Timestamp of last photo update';
COMMENT ON VIEW club_with_member_count IS 'Optimized view for club data with member counts';

-- =========================
-- Verification Queries
-- =========================

-- Verify new columns exist
DO $$
BEGIN
  -- Check if columns were added successfully
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'book_clubs'
      AND column_name = 'cover_photo_url'
  ) THEN
    RAISE NOTICE 'SUCCESS: Photo columns added to book_clubs table';
  ELSE
    RAISE EXCEPTION 'FAILED: Photo columns not added to book_clubs table';
  END IF;

  -- Check if storage bucket was created
  IF EXISTS (
    SELECT 1 FROM storage.buckets
    WHERE id = 'club-photos'
  ) THEN
    RAISE NOTICE 'SUCCESS: club-photos storage bucket created';
  ELSE
    RAISE EXCEPTION 'FAILED: club-photos storage bucket not created';
  END IF;

  -- Check if view was created
  IF EXISTS (
    SELECT 1 FROM information_schema.views
    WHERE table_name = 'club_with_member_count'
  ) THEN
    RAISE NOTICE 'SUCCESS: club_with_member_count view created';
  ELSE
    RAISE EXCEPTION 'FAILED: club_with_member_count view not created';
  END IF;

  RAISE NOTICE 'Club Photos Schema Migration completed successfully!';
END $$;
