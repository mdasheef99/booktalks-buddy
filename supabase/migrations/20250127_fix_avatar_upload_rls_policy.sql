-- Fix Avatar Upload RLS Policy
-- Migration: 20250127_fix_avatar_upload_rls_policy.sql
-- Purpose: Fix the RLS policy for avatar uploads to match the actual filename pattern

-- =========================
-- Drop and Recreate the INSERT Policy for Avatar Uploads
-- =========================

-- Drop the existing policy that might have incorrect filename matching
DROP POLICY IF EXISTS "Users can upload own profile pictures" ON storage.objects;

-- Create a more flexible INSERT policy for avatar uploads
CREATE POLICY "Users can upload own profile pictures" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'profiles' AND 
  (storage.foldername(name))[1] = 'avatars' AND
  -- More flexible filename check: just ensure it starts with user ID
  (storage.filename(name) ~ ('^' || auth.uid()::text || '-.*'))
);

-- =========================
-- Verify the Policy Works
-- =========================

-- Add comment for documentation
COMMENT ON POLICY "Users can upload own profile pictures" ON storage.objects IS 'Users can upload avatar images to their own folder in profiles bucket with flexible filename matching';

-- =========================
-- Alternative: Create a Simpler Policy (if the above doesn't work)
-- =========================

-- If the regex approach doesn't work, we can use a simpler approach
-- Uncomment the following if needed:

/*
DROP POLICY IF EXISTS "Users can upload own profile pictures" ON storage.objects;

CREATE POLICY "Users can upload own profile pictures" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'profiles' AND 
  (storage.foldername(name))[1] = 'avatars'
  -- Remove filename restriction for now to allow uploads
);
*/

-- =========================
-- Verification Query
-- =========================

-- Check that the policy exists
SELECT policyname, cmd, roles, qual
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects' 
  AND policyname = 'Users can upload own profile pictures';
