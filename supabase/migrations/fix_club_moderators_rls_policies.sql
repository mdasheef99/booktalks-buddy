-- Fix Club Moderators RLS Policies
-- Resolve 403 Forbidden error when club leads try to appoint moderators
-- Generated to fix INSERT permission issues

-- =========================
-- DIAGNOSTIC: Check current state
-- =========================

-- Check if RLS is enabled on club_moderators table
SELECT 
  schemaname, 
  tablename, 
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'club_moderators' AND schemaname = 'public';

-- Check existing policies on club_moderators
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'club_moderators' AND schemaname = 'public'
ORDER BY policyname;

-- Check if club_moderators table has the expected columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'club_moderators' AND table_schema = 'public'
ORDER BY ordinal_position;

-- =========================
-- DROP ALL EXISTING POLICIES TO AVOID CONFLICTS
-- =========================

-- Drop all existing policies that might be conflicting
DROP POLICY IF EXISTS "Anyone can view club moderators" ON public.club_moderators;
DROP POLICY IF EXISTS "Club leads and store admins can insert club moderators" ON public.club_moderators;
DROP POLICY IF EXISTS "Club leads and store admins can delete club moderators" ON public.club_moderators;
DROP POLICY IF EXISTS "Club leads can manage moderators" ON public.club_moderators;
DROP POLICY IF EXISTS "Club members can view moderators" ON public.club_moderators;
DROP POLICY IF EXISTS "Users can view club moderators" ON public.club_moderators;
DROP POLICY IF EXISTS "Moderators can view own record" ON public.club_moderators;

-- =========================
-- CREATE NEW, WORKING RLS POLICIES
-- =========================

-- Policy 1: Users can view moderators of clubs they're members of
CREATE POLICY "Users can view club moderators" ON public.club_moderators
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.club_members cm
      WHERE cm.club_id = public.club_moderators.club_id
      AND cm.user_id = auth.uid()
    )
  );

-- Policy 2: Club leads can insert moderators for their clubs
CREATE POLICY "Club leads can insert moderators" ON public.club_moderators
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.book_clubs bc
      WHERE bc.id = public.club_moderators.club_id
      AND bc.lead_user_id = auth.uid()
    )
  );

-- Policy 3: Store administrators can insert moderators for clubs in their stores
CREATE POLICY "Store admins can insert moderators" ON public.club_moderators
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.store_administrators sa
      JOIN public.book_clubs bc ON sa.store_id = bc.store_id
      WHERE bc.id = public.club_moderators.club_id
      AND sa.user_id = auth.uid()
    )
  );

-- Policy 4: Club leads can update moderators in their clubs
CREATE POLICY "Club leads can update moderators" ON public.club_moderators
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.book_clubs bc
      WHERE bc.id = public.club_moderators.club_id
      AND bc.lead_user_id = auth.uid()
    )
  );

-- Policy 5: Club leads can delete moderators from their clubs
CREATE POLICY "Club leads can delete moderators" ON public.club_moderators
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.book_clubs bc
      WHERE bc.id = public.club_moderators.club_id
      AND bc.lead_user_id = auth.uid()
    )
  );

-- Policy 6: Store administrators can manage moderators in their stores
CREATE POLICY "Store admins can manage moderators" ON public.club_moderators
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.store_administrators sa
      JOIN public.book_clubs bc ON sa.store_id = bc.store_id
      WHERE bc.id = public.club_moderators.club_id
      AND sa.user_id = auth.uid()
    )
  );

-- =========================
-- VERIFICATION: Check policies were created
-- =========================

-- Check that policies were created successfully
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename = 'club_moderators' AND schemaname = 'public'
ORDER BY policyname;

-- Test if INSERT is working (should work for club leads)
-- INSERT INTO public.club_moderators (
--   club_id, user_id, appointed_by, role, is_active,
--   analytics_access, content_moderation_access, member_management_access,
--   meeting_management_access, customization_access
-- ) VALUES (
--   'YOUR_CLUB_ID_HERE', 'USER_TO_APPOINT_ID', auth.uid(), 'moderator', true,
--   false, true, true, false, false
-- );

-- =========================
-- ADDITIONAL DIAGNOSTIC QUERIES
-- =========================

-- Check if current user is a club lead
-- SELECT bc.id, bc.name, bc.lead_user_id, auth.uid() as current_user
-- FROM public.book_clubs bc
-- WHERE bc.lead_user_id = auth.uid();

-- Check club membership
-- SELECT cm.club_id, cm.user_id, bc.name as club_name, bc.lead_user_id
-- FROM public.club_members cm
-- JOIN public.book_clubs bc ON bc.id = cm.club_id
-- WHERE cm.user_id = auth.uid();
