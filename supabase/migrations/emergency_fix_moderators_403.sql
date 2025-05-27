-- EMERGENCY FIX - Club Moderators 403 Error
-- Temporarily allow authenticated users to insert moderators for testing
-- This will help us identify if the issue is with RLS policies or something else

-- =========================
-- STEP 1: DROP ALL EXISTING POLICIES
-- =========================

DROP POLICY IF EXISTS "Anyone can view club moderators" ON public.club_moderators;
DROP POLICY IF EXISTS "Club leads and store admins can insert club moderators" ON public.club_moderators;
DROP POLICY IF EXISTS "Club leads and store admins can delete club moderators" ON public.club_moderators;
DROP POLICY IF EXISTS "Club leads can manage moderators" ON public.club_moderators;
DROP POLICY IF EXISTS "Club members can view moderators" ON public.club_moderators;
DROP POLICY IF EXISTS "Users can view club moderators" ON public.club_moderators;
DROP POLICY IF EXISTS "Moderators can view own record" ON public.club_moderators;
DROP POLICY IF EXISTS "Club leads can insert moderators" ON public.club_moderators;
DROP POLICY IF EXISTS "Store admins can insert moderators" ON public.club_moderators;
DROP POLICY IF EXISTS "Club leads can update moderators" ON public.club_moderators;
DROP POLICY IF EXISTS "Club leads can delete moderators" ON public.club_moderators;
DROP POLICY IF EXISTS "Store admins can manage moderators" ON public.club_moderators;

-- =========================
-- STEP 2: CREATE SIMPLE, PERMISSIVE POLICIES FOR TESTING
-- =========================

-- Allow all authenticated users to view moderators
CREATE POLICY "Allow authenticated users to view moderators" ON public.club_moderators
  FOR SELECT USING (
    auth.role() = 'authenticated'
  );

-- Allow all authenticated users to insert moderators (TEMPORARY FOR TESTING)
CREATE POLICY "Allow authenticated users to insert moderators" ON public.club_moderators
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated'
  );

-- Allow all authenticated users to update moderators (TEMPORARY FOR TESTING)
CREATE POLICY "Allow authenticated users to update moderators" ON public.club_moderators
  FOR UPDATE USING (
    auth.role() = 'authenticated'
  );

-- Allow all authenticated users to delete moderators (TEMPORARY FOR TESTING)
CREATE POLICY "Allow authenticated users to delete moderators" ON public.club_moderators
  FOR DELETE USING (
    auth.role() = 'authenticated'
  );

-- =========================
-- STEP 3: VERIFICATION
-- =========================

-- Check that policies were created successfully
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'club_moderators' AND schemaname = 'public'
ORDER BY policyname;

-- Test basic INSERT (this should now work)
-- INSERT INTO public.club_moderators (
--   club_id, user_id, appointed_by, role, is_active,
--   analytics_access, content_moderation_access, member_management_access,
--   meeting_management_access, customization_access
-- ) VALUES (
--   'test-club-id', 'test-user-id', auth.uid(), 'moderator', true,
--   false, true, true, false, false
-- );

-- =========================
-- IMPORTANT NOTE
-- =========================
-- This is a TEMPORARY fix for testing purposes only!
-- After confirming the moderator appointment works, we should:
-- 1. Replace these permissive policies with proper role-based policies
-- 2. Ensure only club leads and store admins can manage moderators
-- 3. Test the proper policies thoroughly

-- To restore proper security later, run:
-- supabase/migrations/fix_club_moderators_rls_policies.sql
