-- Store Management Storage Buckets Setup
-- Phase 1: Create storage buckets for Store Management images
-- Migration: 20240104_storage_buckets_setup.sql

-- =========================
-- Create Storage Buckets
-- =========================

-- Carousel Images Bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'store-carousel-images',
  'store-carousel-images',
  true,
  3145728, -- 3MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Banner Images Bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'store-banner-images',
  'store-banner-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Community Images Bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'store-community-images',
  'store-community-images',
  true,
  2097152, -- 2MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- =========================
-- Storage Policies for Carousel Images
-- =========================

-- Allow Store Owners to upload carousel images
CREATE POLICY "Store owners can upload carousel images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'store-carousel-images' AND
  EXISTS (
    SELECT 1 FROM store_administrators sa
    WHERE sa.user_id = auth.uid()
    AND sa.role = 'owner'
    AND (storage.foldername(name))[1] = sa.store_id::text
  )
);

-- Allow Store Owners to update their carousel images
CREATE POLICY "Store owners can update their carousel images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'store-carousel-images' AND
  EXISTS (
    SELECT 1 FROM store_administrators sa
    WHERE sa.user_id = auth.uid()
    AND sa.role = 'owner'
    AND (storage.foldername(name))[1] = sa.store_id::text
  )
);

-- Allow Store Owners to delete their carousel images
CREATE POLICY "Store owners can delete their carousel images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'store-carousel-images' AND
  EXISTS (
    SELECT 1 FROM store_administrators sa
    WHERE sa.user_id = auth.uid()
    AND sa.role = 'owner'
    AND (storage.foldername(name))[1] = sa.store_id::text
  )
);

-- Allow public read access to carousel images
CREATE POLICY "Anyone can view carousel images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'store-carousel-images');

-- =========================
-- Storage Policies for Banner Images
-- =========================

-- Allow Store Owners to upload banner images
CREATE POLICY "Store owners can upload banner images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'store-banner-images' AND
  EXISTS (
    SELECT 1 FROM store_administrators sa
    WHERE sa.user_id = auth.uid()
    AND sa.role = 'owner'
    AND (storage.foldername(name))[1] = sa.store_id::text
  )
);

-- Allow Store Owners to update their banner images
CREATE POLICY "Store owners can update their banner images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'store-banner-images' AND
  EXISTS (
    SELECT 1 FROM store_administrators sa
    WHERE sa.user_id = auth.uid()
    AND sa.role = 'owner'
    AND (storage.foldername(name))[1] = sa.store_id::text
  )
);

-- Allow Store Owners to delete their banner images
CREATE POLICY "Store owners can delete their banner images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'store-banner-images' AND
  EXISTS (
    SELECT 1 FROM store_administrators sa
    WHERE sa.user_id = auth.uid()
    AND sa.role = 'owner'
    AND (storage.foldername(name))[1] = sa.store_id::text
  )
);

-- Allow public read access to banner images
CREATE POLICY "Anyone can view banner images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'store-banner-images');

-- =========================
-- Storage Policies for Community Images
-- =========================

-- Allow Store Owners to upload community images
CREATE POLICY "Store owners can upload community images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'store-community-images' AND
  EXISTS (
    SELECT 1 FROM store_administrators sa
    WHERE sa.user_id = auth.uid()
    AND sa.role = 'owner'
    AND (storage.foldername(name))[1] = sa.store_id::text
  )
);

-- Allow Store Owners to update their community images
CREATE POLICY "Store owners can update their community images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'store-community-images' AND
  EXISTS (
    SELECT 1 FROM store_administrators sa
    WHERE sa.user_id = auth.uid()
    AND sa.role = 'owner'
    AND (storage.foldername(name))[1] = sa.store_id::text
  )
);

-- Allow Store Owners to delete their community images
CREATE POLICY "Store owners can delete their community images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'store-community-images' AND
  EXISTS (
    SELECT 1 FROM store_administrators sa
    WHERE sa.user_id = auth.uid()
    AND sa.role = 'owner'
    AND (storage.foldername(name))[1] = sa.store_id::text
  )
);

-- Allow public read access to community images
CREATE POLICY "Anyone can view community images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'store-community-images');

-- =========================
-- Comments for documentation
-- =========================
COMMENT ON POLICY "Store owners can upload carousel images" ON storage.objects IS 'Store Owners can upload images to their store folder in carousel bucket';
COMMENT ON POLICY "Store owners can upload banner images" ON storage.objects IS 'Store Owners can upload images to their store folder in banner bucket';
COMMENT ON POLICY "Store owners can upload community images" ON storage.objects IS 'Store Owners can upload images to their store folder in community bucket';
