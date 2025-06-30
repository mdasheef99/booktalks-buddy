-- Debug and Fix Book Listings RLS Policies
-- Generated on 2025-06-25
-- Purpose: Thoroughly investigate and fix RLS policies

-- =========================
-- First, let's see what policies currently exist
-- =========================
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'book_listings' 
ORDER BY policyname;

-- Check storage policies too
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage'
AND policyname LIKE '%book%listing%'
ORDER BY policyname;

-- =========================
-- Drop ALL existing book_listings policies to start fresh
-- =========================
DROP POLICY IF EXISTS "Anyone can create book listings" ON book_listings;
DROP POLICY IF EXISTS "Public can create book listings" ON book_listings;
DROP POLICY IF EXISTS "Store owners can view their store listings" ON book_listings;
DROP POLICY IF EXISTS "Store owners can update their store listings" ON book_listings;

-- =========================
-- Drop ALL existing storage policies for book listing images
-- =========================
DROP POLICY IF EXISTS "Anyone can upload book listing images" ON storage.objects;
DROP POLICY IF EXISTS "Public can upload book listing images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view book listing images" ON storage.objects;
DROP POLICY IF EXISTS "Store owners can delete book listing images" ON storage.objects;

-- =========================
-- Create fresh RLS policies for book_listings table
-- =========================

-- Policy 1: Allow ANYONE (including anonymous) to insert book listings
CREATE POLICY "allow_public_insert_book_listings"
ON book_listings
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Policy 2: Store owners can view listings for their store
CREATE POLICY "allow_store_owners_select_book_listings"
ON book_listings
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM store_administrators sa
    WHERE sa.user_id = auth.uid()
    AND sa.store_id = book_listings.store_id
    AND sa.role = 'owner'
  )
);

-- Policy 3: Store owners can update listings for their store
CREATE POLICY "allow_store_owners_update_book_listings"
ON book_listings
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM store_administrators sa
    WHERE sa.user_id = auth.uid()
    AND sa.store_id = book_listings.store_id
    AND sa.role = 'owner'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM store_administrators sa
    WHERE sa.user_id = auth.uid()
    AND sa.store_id = book_listings.store_id
    AND sa.role = 'owner'
  )
);

-- =========================
-- Create fresh storage policies for book listing images
-- =========================

-- Policy 1: Allow ANYONE to upload book listing images
CREATE POLICY "allow_public_insert_book_listing_images"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'book-listing-images'
);

-- Policy 2: Allow ANYONE to view book listing images
CREATE POLICY "allow_public_select_book_listing_images"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'book-listing-images');

-- Policy 3: Store owners can delete book listing images
CREATE POLICY "allow_store_owners_delete_book_listing_images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'book-listing-images' AND
  EXISTS (
    SELECT 1 FROM book_listings bl
    JOIN store_administrators sa ON sa.store_id = bl.store_id
    WHERE sa.user_id = auth.uid()
    AND sa.role = 'owner'
    AND (
      bl.image_1_url LIKE '%' || name || '%' OR
      bl.image_2_url LIKE '%' || name || '%' OR
      bl.image_3_url LIKE '%' || name || '%'
    )
  )
);

-- =========================
-- Verify the new policies are created
-- =========================
SELECT 'book_listings policies:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename = 'book_listings' 
ORDER BY policyname;

SELECT 'storage policies:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage'
AND policyname LIKE '%book%listing%'
ORDER BY policyname;

-- =========================
-- Test the policies work
-- =========================
-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'book_listings';

-- Check if the bucket exists
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets 
WHERE id = 'book-listing-images';
