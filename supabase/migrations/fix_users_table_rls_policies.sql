-- Fix Users Table RLS Policies - COMPREHENSIVE DIAGNOSTIC AND FIX
-- Allow access to user profile data for club management functionality
-- Generated to fix 400 Bad Request error when fetching user details

-- =========================
-- DIAGNOSTIC: Check current state
-- =========================

-- Check if RLS is enabled on public.users table
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'users' AND schemaname = 'public';

-- Check existing policies on public.users
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'users' AND schemaname = 'public'
ORDER BY policyname;

-- Check if public.users table has the expected columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- =========================
-- ENABLE RLS if not already enabled
-- =========================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- =========================
-- DROP existing policies to avoid conflicts
-- =========================
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Club leads can view member profiles" ON public.users;
DROP POLICY IF EXISTS "Store admins can view club member profiles" ON public.users;
DROP POLICY IF EXISTS "Club moderators can view member profiles" ON public.users;
DROP POLICY IF EXISTS "Club members can view other member profiles" ON public.users;

-- =========================
-- Create RLS policies for public.users table
-- =========================

-- Policy 1: Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (
    id = auth.uid()
  );

-- Policy 2: Club leads can view profiles of their club members
CREATE POLICY "Club leads can view member profiles" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.club_members cm
      JOIN public.book_clubs bc ON bc.id = cm.club_id
      WHERE cm.user_id = public.users.id
      AND bc.lead_user_id = auth.uid()
    )
  );

-- Policy 3: Store administrators can view profiles of users in their store's clubs
CREATE POLICY "Store admins can view club member profiles" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.club_members cm
      JOIN public.book_clubs bc ON bc.id = cm.club_id
      JOIN public.store_administrators sa ON sa.store_id = bc.store_id
      WHERE cm.user_id = public.users.id
      AND sa.user_id = auth.uid()
    )
  );

-- Policy 4: Club moderators can view profiles of members in clubs they moderate
CREATE POLICY "Club moderators can view member profiles" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.club_members cm
      JOIN public.club_moderators mod ON mod.club_id = cm.club_id
      WHERE cm.user_id = public.users.id
      AND mod.user_id = auth.uid()
      AND mod.is_active = true
    )
  );

-- Policy 5: Club members can view profiles of other members in their clubs
CREATE POLICY "Club members can view other member profiles" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.club_members cm1
      JOIN public.club_members cm2 ON cm1.club_id = cm2.club_id
      WHERE cm1.user_id = public.users.id
      AND cm2.user_id = auth.uid()
      AND cm1.role != 'pending'
      AND cm2.role != 'pending'
    )
  );

-- =========================
-- VERIFICATION: Check policies were created
-- =========================

-- Check that policies were created successfully
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'users' AND schemaname = 'public'
ORDER BY policyname;

-- Test if RLS is working (should return current user's profile)
-- SELECT id, username, displayname, email FROM public.users WHERE id = auth.uid();

-- =========================
-- ADDITIONAL DIAGNOSTIC QUERIES
-- =========================

-- Test the exact query that the service is making
-- SELECT id, username, displayname, avatar_url
-- FROM public.users
-- WHERE id IN ('user-id-1', 'user-id-2', 'user-id-3');

-- Check if there are any users with data
-- SELECT COUNT(*) as total_users,
--        COUNT(username) as users_with_username,
--        COUNT(displayname) as users_with_displayname
-- FROM public.users;
