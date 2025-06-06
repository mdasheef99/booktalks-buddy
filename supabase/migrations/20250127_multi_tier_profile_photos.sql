-- Multi-Tier Profile Photo System Setup - CUSTOMIZED FOR EXISTING SETUP
-- Migration: 20250127_multi_tier_profile_photos.sql
-- Phase 1: Database schema and storage setup for multi-tier profile photos
--
-- EXISTING SETUP DETECTED:
-- - Profiles bucket exists (2MB limit)
-- - avatar_url column exists
-- - 3 storage policies exist (SELECT, UPDATE, DELETE)
-- - 14 users, no avatars yet

-- =========================
-- Add Multi-Size Avatar Columns to Users Table
-- =========================

-- Add new columns for multi-tier avatar URLs (avatar_url already exists)
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS avatar_thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS avatar_medium_url TEXT,
ADD COLUMN IF NOT EXISTS avatar_full_url TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.users.avatar_thumbnail_url IS '100x100 thumbnail for navigation and small UI elements';
COMMENT ON COLUMN public.users.avatar_medium_url IS '300x300 medium size for lists and cards';
COMMENT ON COLUMN public.users.avatar_full_url IS '600x600 full size for profile pages';
COMMENT ON COLUMN public.users.avatar_url IS 'Legacy field, maintained for backward compatibility (points to full_url)';

-- Add composite index for performance optimization
CREATE INDEX IF NOT EXISTS idx_users_avatar_urls ON public.users(avatar_thumbnail_url, avatar_medium_url, avatar_full_url);

-- =========================
-- Update Existing Profiles Storage Bucket
-- =========================

-- Update existing profiles bucket to support larger original uploads (5MB)
-- Note: This preserves existing settings while increasing file size limit
UPDATE storage.buckets
SET file_size_limit = 5242880  -- Increase from 2MB to 5MB for original uploads
WHERE id = 'profiles';

-- =========================
-- Storage Policies for Profile Photos
-- =========================

-- EXISTING POLICIES DETECTED:
-- - "Anyone can view profile pictures" (SELECT)
-- - "Users can update own profile pictures" (UPDATE)
-- - "Users can delete own profile pictures" (DELETE)
--
-- MISSING: INSERT policy for uploading new avatars

-- Add missing INSERT policy for uploading avatars
-- Note: This complements your existing policies without modifying them
CREATE POLICY "Users can upload own profile pictures" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'profiles' AND
  (storage.foldername(name))[1] = 'avatars' AND
  -- Ensure filename starts with user's ID for security
  (storage.filename(name) LIKE auth.uid()::text || '-%')
);

-- =========================
-- Update Users Table RLS Policies for New Columns
-- =========================

-- Your existing "Users can update own profile" policy already covers the new avatar columns
-- No additional RLS policies needed for users table

-- =========================
-- Data Migration for Existing Users
-- =========================

-- Since no users currently have avatars (avatar_url is NULL for all 14 users),
-- no data migration is needed. Future avatar uploads will populate all fields.

-- =========================
-- Comments for Documentation
-- =========================

COMMENT ON POLICY "Users can upload own profile pictures" ON storage.objects IS 'Users can upload avatar images to their own folder in profiles bucket (complements existing policies)';

-- =========================
-- Verification Queries
-- =========================

-- Verify new columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name LIKE '%avatar%'
ORDER BY column_name;

-- Verify storage bucket was updated
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id = 'profiles';

-- Verify all storage policies exist (including new INSERT policy)
SELECT policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND qual ILIKE '%profiles%'
ORDER BY policyname;

-- Verify index was created
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'users'
  AND indexdef ILIKE '%avatar%';
