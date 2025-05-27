-- =====================================================
-- Fix Moderator Query RLS Policies
-- Addresses the database error in moderator management system
-- =====================================================

-- Step 1: Ensure users table has proper RLS policies for joins
-- This is likely the main issue - users table RLS blocking the join

-- Drop existing conflicting policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Club leads can view member profiles" ON public.users;
DROP POLICY IF EXISTS "Store admins can view club member profiles" ON public.users;
DROP POLICY IF EXISTS "Club moderators can view member profiles" ON public.users;
DROP POLICY IF EXISTS "Club members can view other member profiles" ON public.users;

-- Create comprehensive RLS policies for users table
-- Policy 1: Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (
    id = auth.uid()
  );

-- Policy 2: Club members can view other club member profiles
CREATE POLICY "Club members can view other member profiles" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.club_members cm1
      JOIN public.club_members cm2 ON cm1.club_id = cm2.club_id
      WHERE cm1.user_id = auth.uid()
      AND cm2.user_id = public.users.id
    )
  );

-- Policy 3: Club leads can view all member profiles in their clubs
CREATE POLICY "Club leads can view member profiles" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.club_members cm
      JOIN public.book_clubs bc ON bc.id = cm.club_id
      WHERE cm.user_id = public.users.id
      AND bc.lead_user_id = auth.uid()
    )
  );

-- Policy 4: Store administrators can view profiles in their store's clubs
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

-- Policy 5: Club moderators can view profiles of users in clubs they moderate
CREATE POLICY "Club moderators can view member profiles" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.club_moderators mod
      JOIN public.club_members cm ON cm.club_id = mod.club_id
      WHERE mod.user_id = auth.uid()
      AND mod.is_active = true
      AND cm.user_id = public.users.id
    )
  );

-- Step 2: Ensure club_moderators table has proper RLS policies

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view club moderators" ON public.club_moderators;
DROP POLICY IF EXISTS "Club leads can insert moderators" ON public.club_moderators;
DROP POLICY IF EXISTS "Store admins can insert moderators" ON public.club_moderators;
DROP POLICY IF EXISTS "Club leads can update moderators" ON public.club_moderators;
DROP POLICY IF EXISTS "Club leads can delete moderators" ON public.club_moderators;
DROP POLICY IF EXISTS "Store admins can manage moderators" ON public.club_moderators;
DROP POLICY IF EXISTS "Anyone can view club moderators" ON public.club_moderators;

-- Create new comprehensive policies for club_moderators
-- Policy 1: Club members can view moderators of their clubs
CREATE POLICY "Club members can view moderators" ON public.club_moderators
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.club_members cm
      WHERE cm.club_id = public.club_moderators.club_id
      AND cm.user_id = auth.uid()
    )
  );

-- Policy 2: Club leads can manage moderators in their clubs
CREATE POLICY "Club leads can manage moderators" ON public.club_moderators
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.book_clubs bc
      WHERE bc.id = public.club_moderators.club_id
      AND bc.lead_user_id = auth.uid()
    )
  );

-- Policy 3: Store administrators can manage moderators in their store's clubs
CREATE POLICY "Store admins can manage moderators" ON public.club_moderators
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.store_administrators sa
      JOIN public.book_clubs bc ON sa.store_id = bc.store_id
      WHERE bc.id = public.club_moderators.club_id
      AND sa.user_id = auth.uid()
    )
  );

-- Policy 4: Moderators can view their own moderator record
CREATE POLICY "Moderators can view own record" ON public.club_moderators
  FOR SELECT USING (
    user_id = auth.uid()
  );

-- Step 3: Ensure proper table permissions
-- Grant necessary permissions for the join to work
GRANT SELECT ON public.users TO authenticated;
GRANT SELECT ON public.club_moderators TO authenticated;
GRANT SELECT ON public.club_members TO authenticated;
GRANT SELECT ON public.book_clubs TO authenticated;

-- Step 4: Create a test function to verify the fix
CREATE OR REPLACE FUNCTION test_moderator_query(test_club_id UUID)
RETURNS TABLE (
  moderator_id UUID,
  moderator_user_id UUID,
  username TEXT,
  email TEXT,
  displayname TEXT,
  test_status TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cm.id as moderator_id,
    cm.user_id as moderator_user_id,
    u.username,
    u.email,
    u.displayname,
    'SUCCESS' as test_status
  FROM public.club_moderators cm
  LEFT JOIN public.users u ON u.id = cm.user_id
  WHERE cm.club_id = test_club_id
  AND cm.is_active = true;
  
  -- If no results, return a diagnostic row
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      NULL::UUID as moderator_id,
      NULL::UUID as moderator_user_id,
      'NO_MODERATORS'::TEXT as username,
      'NO_MODERATORS'::TEXT as email,
      'NO_MODERATORS'::TEXT as displayname,
      'NO_RESULTS'::TEXT as test_status;
  END IF;
END;
$$;

-- Step 5: Verification queries
-- Check that policies were created successfully
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd
FROM pg_policies 
WHERE (tablename = 'club_moderators' OR tablename = 'users')
AND schemaname = 'public'
ORDER BY tablename, policyname;

-- Test the join query directly
-- SELECT 
--   cm.id,
--   cm.user_id,
--   cm.role,
--   u.username,
--   u.email,
--   u.displayname
-- FROM public.club_moderators cm
-- LEFT JOIN public.users u ON u.id = cm.user_id
-- WHERE cm.is_active = true
-- LIMIT 3;

-- =====================================================
-- USAGE INSTRUCTIONS
-- =====================================================

/*
1. Run this script in your Supabase SQL editor
2. Test the moderator query using the test function:
   SELECT * FROM test_moderator_query('your-club-id-here');
3. If successful, the application should now work
4. If still failing, check the console logs for specific error messages

TROUBLESHOOTING:
- If you get permission errors, ensure the user is a club member
- If you get no results, check if moderators exist for the club
- If join fails, verify foreign key relationships
*/
