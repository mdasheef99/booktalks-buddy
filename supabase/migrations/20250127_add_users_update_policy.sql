-- Add UPDATE Policy for Users Table
-- Migration: 20250127_add_users_update_policy.sql
-- Purpose: Allow users to update their own profile data including avatar URLs

-- =========================
-- Check Current RLS Policies on Users Table
-- =========================

-- First, let's see what policies currently exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'users' AND schemaname = 'public'
ORDER BY policyname;

-- =========================
-- Add Missing UPDATE Policy for Users Table
-- =========================

-- Allow users to update their own profile data
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (
    id = auth.uid()
  ) WITH CHECK (
    id = auth.uid()
  );

-- =========================
-- Verification
-- =========================

-- Check that the UPDATE policy was created
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'users' 
  AND schemaname = 'public' 
  AND cmd = 'UPDATE'
ORDER BY policyname;

-- =========================
-- Test the Policy (Optional - for debugging)
-- =========================

-- Test if the current user can update their own profile
-- This should work after the policy is created:
-- UPDATE public.users 
-- SET avatar_url = 'test-url' 
-- WHERE id = auth.uid();

-- =========================
-- Comments for Documentation
-- =========================

COMMENT ON POLICY "Users can update own profile" ON public.users IS 'Users can update their own profile data including avatar URLs and other profile fields';
