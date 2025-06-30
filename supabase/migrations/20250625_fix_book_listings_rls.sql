-- Fix Book Listings RLS Policies
-- Generated on 2025-06-25
-- Purpose: Fix RLS policies to allow public book listing submissions

-- =========================
-- Drop existing policies
-- =========================
DROP POLICY IF EXISTS "Anyone can create book listings" ON book_listings;

-- =========================
-- Create new RLS policies for book_listings table
-- =========================

-- Allow anyone (including anonymous users) to insert new book listings
CREATE POLICY "Public can create book listings"
ON book_listings
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Store owners can view all listings for their store
CREATE POLICY "Store owners can view their store listings"
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

-- Store owners can update listings for their store
CREATE POLICY "Store owners can update their store listings"
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
-- Update Storage RLS Policies for Book Listing Images
-- =========================

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can upload book listing images" ON storage.objects;

-- Allow anyone (including anonymous users) to upload book listing images
CREATE POLICY "Public can upload book listing images"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'book-listing-images'
);

-- Allow anyone to view book listing images
CREATE POLICY "Anyone can view book listing images"
ON storage.objects
FOR SELECT
TO anon, authenticated, public
USING (bucket_id = 'book-listing-images');

-- Store owners can delete book listing images for their store
CREATE POLICY "Store owners can delete book listing images"
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
