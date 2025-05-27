-- EMERGENCY DEBUGGING - Users Table 400 Error
-- Let's figure out exactly what's wrong

-- =========================
-- 1. CHECK IF USERS TABLE EXISTS AND SCHEMA
-- =========================

-- Check if public.users table exists
SELECT 
  schemaname, 
  tablename, 
  tableowner,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'users';

-- Check columns in users table
SELECT 
  table_schema,
  table_name,
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'users'
ORDER BY table_schema, ordinal_position;

-- =========================
-- 2. CHECK RLS POLICIES
-- =========================

-- Check all policies on users table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY schemaname, policyname;

-- =========================
-- 3. TEST BASIC ACCESS
-- =========================

-- Test if we can access users table at all (as superuser)
-- SELECT COUNT(*) FROM public.users;

-- Test if current user can see their own profile
-- SELECT id, username, displayname, email FROM public.users WHERE id = auth.uid();

-- =========================
-- 4. CHECK AUTH CONTEXT
-- =========================

-- Check current auth context
SELECT 
  auth.uid() as current_user_id,
  auth.role() as current_role;

-- =========================
-- 5. TEST THE EXACT FAILING QUERY
-- =========================

-- This is the exact query that's failing - let's test it step by step
-- First, let's see if we can select from users at all:
-- SELECT id FROM public.users LIMIT 1;

-- Then test with specific IDs (replace with actual IDs from error):
-- SELECT id, username, displayname, avatar_url 
-- FROM public.users 
-- WHERE id IN (
--   'd5329cc4-d896-4f7e-9f7f-be19a8dfd895',
--   'f6cea68f-7e3e-4f18-9d1a-de90f30ecdcf',
--   '57b3036a-1f67-4144-8f94-c51df437a175',
--   '192ea974-1770-4b03-9dba-cc8121525c57'
-- );

-- =========================
-- 6. CHECK IF USERS EXIST IN CLUB_MEMBERS
-- =========================

-- Check if these user IDs exist in club_members
-- SELECT DISTINCT user_id 
-- FROM club_members 
-- WHERE user_id IN (
--   'd5329cc4-d896-4f7e-9f7f-be19a8dfd895',
--   'f6cea68f-7e3e-4f18-9d1a-de90f30ecdcf',
--   '57b3036a-1f67-4144-8f94-c51df437a175',
--   '192ea974-1770-4b03-9dba-cc8121525c57'
-- );

-- =========================
-- 7. EMERGENCY FIX - DISABLE RLS TEMPORARILY
-- =========================

-- If all else fails, temporarily disable RLS to test
-- WARNING: Only do this for debugging!
-- ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Test the query again after disabling RLS
-- SELECT id, username, displayname, avatar_url 
-- FROM public.users 
-- WHERE id IN (
--   'd5329cc4-d896-4f7e-9f7f-be19a8dfd895',
--   'f6cea68f-7e3e-4f18-9d1a-de90f30ecdcf',
--   '57b3036a-1f67-4144-8f94-c51df437a175',
--   '192ea974-1770-4b03-9dba-cc8121525c57'
-- );

-- Re-enable RLS after testing
-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
