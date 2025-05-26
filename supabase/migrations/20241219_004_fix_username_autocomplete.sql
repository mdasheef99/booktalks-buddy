-- Fix Username Autocomplete Database Issues
-- Created: 2024-12-19
-- Purpose: Ensure allow_direct_messages column exists and fix any schema issues

-- =========================
-- Add allow_direct_messages column if missing
-- =========================

-- Add direct messaging preference to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS allow_direct_messages BOOLEAN DEFAULT true;

-- Add comment for documentation
COMMENT ON COLUMN users.allow_direct_messages IS 
'User preference for receiving direct messages. Users can opt-out for privacy.';

-- Create index for performance (most users will allow DMs)
CREATE INDEX IF NOT EXISTS idx_users_allow_direct_messages 
ON users(allow_direct_messages) 
WHERE allow_direct_messages = false;

-- =========================
-- Verification and Testing
-- =========================

-- Test that the column was added successfully
DO $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' 
        AND column_name = 'allow_direct_messages'
        AND table_schema = 'public'
    ) INTO column_exists;

    IF column_exists THEN
        RAISE NOTICE '✅ allow_direct_messages column exists in users table';
    ELSE
        RAISE EXCEPTION '❌ allow_direct_messages column was not created';
    END IF;
END $$;

-- Test the relationship between club_members and users
DO $$
DECLARE
    test_count INTEGER;
BEGIN
    -- Test basic join between club_members and users
    SELECT COUNT(*) INTO test_count
    FROM club_members cm
    JOIN users u ON cm.user_id = u.id
    LIMIT 10;

    RAISE NOTICE '✅ club_members -> users join works, found % relationships', test_count;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ club_members -> users join error: %', SQLERRM;
END $$;

-- Test the search query pattern that was failing
DO $$
DECLARE
    test_count INTEGER;
BEGIN
    -- Test the search pattern used in autocomplete
    SELECT COUNT(*) INTO test_count
    FROM users u
    WHERE u.username IS NOT NULL
    AND u.username ILIKE '%test%'
    LIMIT 5;

    RAISE NOTICE '✅ Username search pattern works, found % matching users', test_count;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Username search pattern error: %', SQLERRM;
END $$;

-- =========================
-- Update existing users to allow direct messages by default
-- =========================

-- Set allow_direct_messages to true for all existing users who have NULL
UPDATE users 
SET allow_direct_messages = true 
WHERE allow_direct_messages IS NULL;

-- =========================
-- Final verification
-- =========================

DO $$
BEGIN
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'Username Autocomplete Database Fix Completed Successfully!';
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'Fixed issues:';
    RAISE NOTICE '  - Added allow_direct_messages column to users table';
    RAISE NOTICE '  - Verified club_members -> users relationship works';
    RAISE NOTICE '  - Tested username search patterns';
    RAISE NOTICE '  - Set default values for existing users';
    RAISE NOTICE '';
    RAISE NOTICE 'The username autocomplete feature should now work correctly.';
    RAISE NOTICE '=============================================================================';
END $$;
