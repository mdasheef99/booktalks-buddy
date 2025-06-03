-- Join Request Questions Schema Migration
-- Created: 2025-01-15
-- Purpose: Add support for custom questions in club join requests

-- Enable pgcrypto for UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================
-- Table: club_join_questions
-- =========================
-- Stores custom questions that club leads can create for join requests
CREATE TABLE IF NOT EXISTS club_join_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES book_clubs(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL CHECK (char_length(question_text) BETWEEN 1 AND 200),
    is_required BOOLEAN NOT NULL DEFAULT false,
    display_order INTEGER NOT NULL CHECK (display_order BETWEEN 1 AND 5),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Ensure unique ordering per club (no duplicate orders)
    UNIQUE(club_id, display_order),
    
    -- Ensure question text is not empty after trimming
    CONSTRAINT question_text_not_empty CHECK (trim(question_text) != '')
);

-- =========================
-- Extend book_clubs table
-- =========================
-- Add flag to enable/disable join request questions
ALTER TABLE book_clubs 
ADD COLUMN IF NOT EXISTS join_questions_enabled BOOLEAN DEFAULT false;

-- =========================
-- Extend club_members table
-- =========================
-- Add JSONB column to store answers for pending join requests
ALTER TABLE club_members 
ADD COLUMN IF NOT EXISTS join_answers JSONB;

-- =========================
-- Indexes for Performance
-- =========================
-- Optimize question queries by club
CREATE INDEX IF NOT EXISTS idx_club_join_questions_club_id 
ON club_join_questions(club_id);

-- Optimize question ordering queries
CREATE INDEX IF NOT EXISTS idx_club_join_questions_order 
ON club_join_questions(club_id, display_order);

-- Optimize answer queries using GIN index for JSONB
CREATE INDEX IF NOT EXISTS idx_club_members_answers 
ON club_members USING GIN (join_answers) 
WHERE join_answers IS NOT NULL;

-- Optimize queries for clubs with questions enabled
CREATE INDEX IF NOT EXISTS idx_book_clubs_questions_enabled 
ON book_clubs(join_questions_enabled) 
WHERE join_questions_enabled = true;

-- =========================
-- Row Level Security Policies
-- =========================

-- Enable RLS on the new table
ALTER TABLE club_join_questions ENABLE ROW LEVEL SECURITY;

-- Policy: Club leads can manage their club's questions
CREATE POLICY "Club leads can manage questions" ON club_join_questions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM book_clubs
            WHERE book_clubs.id = club_join_questions.club_id
            AND book_clubs.lead_user_id = auth.uid()
        )
    );

-- Policy: Anyone can read questions for clubs with questions enabled
CREATE POLICY "Anyone can read enabled club questions" ON club_join_questions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM book_clubs
            WHERE book_clubs.id = club_join_questions.club_id
            AND book_clubs.join_questions_enabled = true
            AND book_clubs.privacy = 'private'
        )
    );

-- Policy: Club leads can view join answers for their clubs
CREATE POLICY "Club leads can view join answers" ON club_members
    FOR SELECT USING (
        role = 'pending' 
        AND join_answers IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM book_clubs 
            WHERE book_clubs.id = club_members.club_id 
            AND book_clubs.lead_user_id = auth.uid()
        )
    );

-- Policy: Users can submit answers when requesting to join
CREATE POLICY "Users can submit join answers" ON club_members
    FOR INSERT WITH CHECK (
        role = 'pending' 
        AND user_id = auth.uid()
        AND (join_answers IS NULL OR join_answers IS NOT NULL)
    );

-- Policy: Users can update their own pending requests (for answer updates)
CREATE POLICY "Users can update own pending requests" ON club_members
    FOR UPDATE USING (
        role = 'pending' 
        AND user_id = auth.uid()
    ) WITH CHECK (
        role = 'pending' 
        AND user_id = auth.uid()
    );

-- =========================
-- Helper Functions
-- =========================

-- Function to validate question count per club (max 5)
CREATE OR REPLACE FUNCTION validate_question_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if adding this question would exceed the limit
    IF (SELECT COUNT(*) FROM club_join_questions WHERE club_id = NEW.club_id) >= 5 THEN
        RAISE EXCEPTION 'Maximum of 5 questions allowed per club';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce question count limit
CREATE TRIGGER enforce_question_limit
    BEFORE INSERT ON club_join_questions
    FOR EACH ROW
    EXECUTE FUNCTION validate_question_count();

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_question_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update timestamp on question changes
CREATE TRIGGER update_question_timestamp_trigger
    BEFORE UPDATE ON club_join_questions
    FOR EACH ROW
    EXECUTE FUNCTION update_question_timestamp();

-- Function to reorder questions when one is deleted
CREATE OR REPLACE FUNCTION reorder_questions_after_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Reorder remaining questions to fill the gap
    UPDATE club_join_questions 
    SET display_order = display_order - 1
    WHERE club_id = OLD.club_id 
    AND display_order > OLD.display_order;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger to reorder questions after deletion
CREATE TRIGGER reorder_questions_trigger
    AFTER DELETE ON club_join_questions
    FOR EACH ROW
    EXECUTE FUNCTION reorder_questions_after_delete();

-- =========================
-- Data Validation Functions
-- =========================

-- Function to validate answer format
CREATE OR REPLACE FUNCTION validate_join_answers(answers JSONB)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if answers is null (allowed for clubs without questions)
    IF answers IS NULL THEN
        RETURN true;
    END IF;
    
    -- Check if answers has required structure
    IF NOT (answers ? 'answers' AND answers ? 'submitted_at') THEN
        RETURN false;
    END IF;
    
    -- Check if answers array exists and is an array
    IF NOT (jsonb_typeof(answers->'answers') = 'array') THEN
        RETURN false;
    END IF;
    
    -- Validate each answer object has required fields
    IF EXISTS (
        SELECT 1 
        FROM jsonb_array_elements(answers->'answers') AS answer
        WHERE NOT (
            answer ? 'question_id' AND 
            answer ? 'answer' AND 
            jsonb_typeof(answer->'question_id') = 'string' AND
            jsonb_typeof(answer->'answer') = 'string' AND
            char_length(answer->>'answer') <= 500
        )
    ) THEN
        RETURN false;
    END IF;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Add constraint to validate answer format
ALTER TABLE club_members 
ADD CONSTRAINT valid_join_answers_format 
CHECK (validate_join_answers(join_answers));

-- =========================
-- Sample Data for Testing (Optional)
-- =========================
-- Uncomment the following section for development/testing

/*
-- Insert sample questions for testing (only if in development)
-- DO $$
-- DECLARE
--     sample_club_id UUID;
-- BEGIN
--     -- Get a sample private club ID
--     SELECT id INTO sample_club_id 
--     FROM book_clubs 
--     WHERE privacy = 'private' 
--     LIMIT 1;
--     
--     -- Only insert if we found a club
--     IF sample_club_id IS NOT NULL THEN
--         -- Enable questions for the sample club
--         UPDATE book_clubs 
--         SET join_questions_enabled = true 
--         WHERE id = sample_club_id;
--         
--         -- Insert sample questions
--         INSERT INTO club_join_questions (club_id, question_text, is_required, display_order) VALUES
--         (sample_club_id, 'Why do you want to join this book club?', true, 1),
--         (sample_club_id, 'What are your favorite book genres?', false, 2),
--         (sample_club_id, 'How often do you read books?', true, 3);
--     END IF;
-- END $$;
*/

-- =========================
-- Verification Queries
-- =========================

-- Check that the table was created successfully
SELECT 'club_join_questions table created' as status, 
       CASE WHEN EXISTS (
           SELECT FROM information_schema.tables 
           WHERE table_name = 'club_join_questions'
       ) THEN 'SUCCESS' ELSE 'FAILED' END as result;

-- Check that columns were added to existing tables
SELECT 'book_clubs.join_questions_enabled added' as status,
       CASE WHEN EXISTS (
           SELECT FROM information_schema.columns 
           WHERE table_name = 'book_clubs' AND column_name = 'join_questions_enabled'
       ) THEN 'SUCCESS' ELSE 'FAILED' END as result;

SELECT 'club_members.join_answers added' as status,
       CASE WHEN EXISTS (
           SELECT FROM information_schema.columns 
           WHERE table_name = 'club_members' AND column_name = 'join_answers'
       ) THEN 'SUCCESS' ELSE 'FAILED' END as result;

-- Check that indexes were created
SELECT 'Indexes created' as status,
       CASE WHEN EXISTS (
           SELECT FROM pg_indexes 
           WHERE tablename = 'club_join_questions' 
           AND indexname = 'idx_club_join_questions_club_id'
       ) THEN 'SUCCESS' ELSE 'FAILED' END as result;

-- Check that RLS policies were created
SELECT 'RLS policies created' as status,
       CASE WHEN EXISTS (
           SELECT FROM pg_policies 
           WHERE tablename = 'club_join_questions'
       ) THEN 'SUCCESS' ELSE 'FAILED' END as result;

-- =========================
-- Migration Complete
-- =========================
SELECT '=== JOIN REQUEST QUESTIONS SCHEMA MIGRATION COMPLETE ===' as summary;
SELECT 'All database changes have been applied successfully.' as message;
SELECT 'Ready to proceed with API implementation.' as next_step;
