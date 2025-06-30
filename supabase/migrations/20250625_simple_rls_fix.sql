-- Simple RLS Fix for Book Listings
-- This approach uses the most permissive policies to ensure functionality

-- =========================
-- Disable RLS temporarily to clean up
-- =========================
ALTER TABLE book_listings DISABLE ROW LEVEL SECURITY;

-- =========================
-- Drop all existing policies
-- =========================
DROP POLICY IF EXISTS "Anyone can create book listings" ON book_listings;
DROP POLICY IF EXISTS "Public can create book listings" ON book_listings;
DROP POLICY IF EXISTS "Store owners can view their store listings" ON book_listings;
DROP POLICY IF EXISTS "Store owners can update their store listings" ON book_listings;
DROP POLICY IF EXISTS "allow_public_insert_book_listings" ON book_listings;
DROP POLICY IF EXISTS "allow_store_owners_select_book_listings" ON book_listings;
DROP POLICY IF EXISTS "allow_store_owners_update_book_listings" ON book_listings;

-- =========================
-- Re-enable RLS
-- =========================
ALTER TABLE book_listings ENABLE ROW LEVEL SECURITY;

-- =========================
-- Create simple, working policies
-- =========================

-- Allow everyone to insert (customers submitting listings)
CREATE POLICY "book_listings_insert_policy"
ON book_listings
FOR INSERT
WITH CHECK (true);

-- Allow authenticated users to select (for admin panel)
CREATE POLICY "book_listings_select_policy"
ON book_listings
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to update (for admin panel)
CREATE POLICY "book_listings_update_policy"
ON book_listings
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to delete (for admin panel)
CREATE POLICY "book_listings_delete_policy"
ON book_listings
FOR DELETE
TO authenticated
USING (true);

-- =========================
-- Storage policies (simple approach)
-- =========================

-- Drop existing storage policies
DROP POLICY IF EXISTS "Anyone can upload book listing images" ON storage.objects;
DROP POLICY IF EXISTS "Public can upload book listing images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view book listing images" ON storage.objects;
DROP POLICY IF EXISTS "allow_public_insert_book_listing_images" ON storage.objects;
DROP POLICY IF EXISTS "allow_public_select_book_listing_images" ON storage.objects;
DROP POLICY IF EXISTS "allow_store_owners_delete_book_listing_images" ON storage.objects;

-- Create simple storage policies
CREATE POLICY "book_listing_images_insert"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'book-listing-images');

CREATE POLICY "book_listing_images_select"
ON storage.objects
FOR SELECT
USING (bucket_id = 'book-listing-images');

CREATE POLICY "book_listing_images_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'book-listing-images');

-- =========================
-- Verify setup
-- =========================
SELECT 'RLS Status:' as info, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'book_listings';

SELECT 'Policies Created:' as info;
SELECT policyname, cmd, roles
FROM pg_policies 
WHERE tablename = 'book_listings' 
ORDER BY policyname;
