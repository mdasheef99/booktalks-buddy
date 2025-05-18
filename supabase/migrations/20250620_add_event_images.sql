-- Event Images Enhancement Migration
-- Generated on 2025-06-20

-- =========================
-- Add image-related columns to events table
-- =========================
ALTER TABLE events
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS medium_url TEXT,
ADD COLUMN IF NOT EXISTS image_alt_text TEXT,
ADD COLUMN IF NOT EXISTS image_metadata JSONB;

-- =========================
-- Create storage bucket for event images if it doesn't exist
-- =========================
DO $$
DECLARE
  bucket_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM storage.buckets WHERE name = 'event-images'
  ) INTO bucket_exists;

  IF NOT bucket_exists THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('event-images', 'event-images', false);
  END IF;
END $$;

-- =========================
-- Set up storage policies for event images
-- =========================

-- Allow authenticated users to view event images
CREATE POLICY "Anyone can view event images"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'event-images'
);

-- Allow authenticated users to upload event images
CREATE POLICY "Authenticated users can upload event images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'event-images' AND
  auth.role() = 'authenticated'
);

-- Allow users to update their own event images
CREATE POLICY "Users can update their own event images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'event-images' AND
  owner = auth.uid()
);

-- Allow users to delete their own event images
CREATE POLICY "Users can delete their own event images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'event-images' AND
  owner = auth.uid()
);
