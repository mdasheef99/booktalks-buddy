-- Fix Join Request Questions Public Access
-- Created: 2025-01-28
-- Purpose: Allow public access to read questions for discovery page

-- =========================
-- Update RLS Policy for Public Access
-- =========================

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Anyone can read enabled club questions" ON club_join_questions;

-- Create new policy that allows public access to read questions
-- for private clubs with questions enabled
CREATE POLICY "Public can read enabled club questions" ON club_join_questions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM book_clubs
            WHERE book_clubs.id = club_join_questions.club_id
            AND book_clubs.join_questions_enabled = true
            AND book_clubs.privacy = 'private'
        )
    );

-- =========================
-- Verification
-- =========================

-- Check that the new policy was created
SELECT 'RLS policy updated' as status,
       CASE WHEN EXISTS (
           SELECT FROM pg_policies 
           WHERE tablename = 'club_join_questions'
           AND policyname = 'Public can read enabled club questions'
       ) THEN 'SUCCESS' ELSE 'FAILED' END as result;

-- =========================
-- Migration Complete
-- =========================
SELECT '=== QUESTIONS PUBLIC ACCESS FIX COMPLETE ===' as summary;
SELECT 'Questions can now be read publicly for discovery.' as message;
