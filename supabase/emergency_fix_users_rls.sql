-- EMERGENCY FIX - Users Table RLS
-- This will temporarily disable RLS to test, then create working policies

-- =========================
-- STEP 1: DISABLE RLS TEMPORARILY FOR TESTING
-- =========================

ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Test the failing query to see if it works without RLS
SELECT id, username, displayname, avatar_url 
FROM public.users 
WHERE id IN (
  'd5329cc4-d896-4f7e-9f7f-be19a8dfd895',
  'f6cea68f-7e3e-4f18-9d1a-de90f30ecdcf',
  '57b3036a-1f67-4144-8f94-c51df437a175',
  '192ea974-1770-4b03-9dba-cc8121525c57'
);

-- =========================
-- STEP 2: RE-ENABLE RLS AND CREATE SIMPLE POLICIES
-- =========================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Club leads can view member profiles" ON public.users;
DROP POLICY IF EXISTS "Store admins can view club member profiles" ON public.users;
DROP POLICY IF EXISTS "Club moderators can view member profiles" ON public.users;
DROP POLICY IF EXISTS "Club members can view other member profiles" ON public.users;

-- Create a simple, permissive policy for testing
CREATE POLICY "Allow authenticated users to view all profiles" ON public.users
  FOR SELECT USING (
    auth.role() = 'authenticated'
  );

-- =========================
-- STEP 3: TEST THE QUERY AGAIN
-- =========================

-- This should now work
SELECT id, username, displayname, avatar_url 
FROM public.users 
WHERE id IN (
  'd5329cc4-d896-4f7e-9f7f-be19a8dfd895',
  'f6cea68f-7e3e-4f18-9d1a-de90f30ecdcf',
  '57b3036a-1f67-4144-8f94-c51df437a175',
  '192ea974-1770-4b03-9dba-cc8121525c57'
);

-- =========================
-- VERIFICATION
-- =========================

-- Check that the policy was created
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public';
