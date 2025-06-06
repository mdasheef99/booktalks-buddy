-- Fix Club Members RLS Policies - FOCUSED FIX
-- Allow club leads and store administrators to view all club members
-- Generated to fix moderator appointment issue

-- =========================
-- Drop existing restrictive policy
-- =========================
DROP POLICY IF EXISTS "Members can view their membership" ON club_members;

-- =========================
-- Create updated SELECT policies for club_members (CORE FIX)
-- =========================

-- Policy 1: Users can view their own membership
CREATE POLICY "Users can view own membership" ON club_members
  FOR SELECT USING (
    user_id = auth.uid()
  );

-- Policy 2: Club leads can view all members of their clubs
CREATE POLICY "Club leads can view all club members" ON club_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM book_clubs
      WHERE book_clubs.id = club_members.club_id
      AND book_clubs.lead_user_id = auth.uid()
    )
  );

-- Policy 3: Store administrators can view members of clubs in their stores
CREATE POLICY "Store admins can view club members" ON club_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM store_administrators sa
      JOIN book_clubs bc ON sa.store_id = bc.store_id
      WHERE bc.id = club_members.club_id
      AND sa.user_id = auth.uid()
    )
  );

-- Policy 4: Club moderators can view members of clubs they moderate
CREATE POLICY "Club moderators can view club members" ON club_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM club_moderators cm
      WHERE cm.club_id = club_members.club_id
      AND cm.user_id = auth.uid()
      AND cm.is_active = true
    )
  );

-- =========================
-- Verification queries
-- =========================

-- Check that policies were created successfully
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'club_members'
ORDER BY policyname;

-- Test query to verify club leads can see members
-- (This should return results when run by a club lead)
-- SELECT cm.user_id, cm.joined_at, u.username, u.display_name
-- FROM club_members cm
-- JOIN users u ON u.id = cm.user_id
-- WHERE cm.club_id = 'YOUR_CLUB_ID_HERE'
-- ORDER BY cm.joined_at DESC;
