-- Simplify Storage Policy for Avatar Uploads
-- Migration: 20250127_simplify_storage_policy.sql
-- Purpose: Create a simpler storage policy to isolate RLS issues

-- =========================
-- Drop and Recreate with Simpler Policy
-- =========================

-- Drop the existing policy
DROP POLICY IF EXISTS "Users can upload own profile pictures" ON storage.objects;

-- Create a simpler policy without filename restrictions
CREATE POLICY "Users can upload own profile pictures" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'profiles' AND 
  (storage.foldername(name))[1] = 'avatars'
  -- Removed filename restriction for debugging
);

-- =========================
-- Verification
-- =========================

-- Check that the policy exists
SELECT policyname, cmd, roles, qual
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects' 
  AND policyname = 'Users can upload own profile pictures';

-- =========================
-- Comments
-- =========================

COMMENT ON POLICY "Users can upload own profile pictures" ON storage.objects IS 'Simplified policy for avatar uploads - allows any authenticated user to upload to avatars folder';
