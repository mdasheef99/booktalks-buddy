-- Fix Club Meetings RLS Policies
-- Corrects the issue where club leads cannot create events due to incorrect role checking
-- 
-- ISSUE: RLS policies were checking for role = 'lead' in club_members table,
-- but club creators are stored with role = 'admin' and lead status is tracked
-- in book_clubs.lead_user_id field.
--
-- SOLUTION: Update policies to use book_clubs.lead_user_id instead of club_members.role

-- =========================
-- Drop existing incorrect policies
-- =========================
DROP POLICY IF EXISTS "Club leads can manage meetings" ON club_meetings;
DROP POLICY IF EXISTS "Club leads can create notifications" ON club_event_notifications;

-- =========================
-- Create corrected policies for club_meetings
-- =========================

-- Policy: Club leads can manage meetings (using book_clubs.lead_user_id)
CREATE POLICY "Club leads can manage meetings" ON club_meetings
  FOR ALL USING (
    club_id IN (
      SELECT id FROM book_clubs
      WHERE lead_user_id = auth.uid()
    )
  );

-- =========================
-- Create corrected policies for club_event_notifications
-- =========================

-- Policy: Club leads can create notifications for their clubs (using book_clubs.lead_user_id)
CREATE POLICY "Club leads can create notifications" ON club_event_notifications
  FOR INSERT WITH CHECK (
    club_id IN (
      SELECT id FROM book_clubs
      WHERE lead_user_id = auth.uid()
    )
  );

-- =========================
-- Verification queries
-- =========================

-- Check that policies were created successfully
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('club_meetings', 'club_event_notifications')
  AND policyname LIKE '%Club leads%'
ORDER BY tablename, policyname;

-- =========================
-- Migration completion log
-- =========================
DO $$
BEGIN
  RAISE NOTICE 'Club Meetings RLS Policies Fixed Successfully';
  RAISE NOTICE 'Updated policies to use book_clubs.lead_user_id instead of club_members.role = ''lead''';
  RAISE NOTICE 'Club leads can now create events and notifications in their clubs';
  RAISE NOTICE 'Migration script: fix_club_meetings_rls_policies.sql';
END $$;
