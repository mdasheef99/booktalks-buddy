-- Database Relationship Diagnosis for Username Autocomplete Error
-- Run this in Supabase SQL Editor to diagnose the PGRST200 error

-- =========================
-- 1. Check if tables exist
-- =========================
SELECT 
    'club_members' as table_name,
    EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'club_members'
    ) as table_exists;

SELECT 
    'users' as table_name,
    EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'users'
    ) as table_exists;

-- =========================
-- 2. Check foreign key relationships
-- =========================
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'club_members'
    AND tc.table_schema = 'public';

-- =========================
-- 3. Check club_members table structure
-- =========================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'club_members'
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- =========================
-- 4. Check users table structure (relevant columns)
-- =========================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'users'
    AND table_schema = 'public'
    AND column_name IN ('id', 'username', 'displayname', 'allow_direct_messages')
ORDER BY ordinal_position;

-- =========================
-- 5. Test the problematic query structure
-- =========================
-- This is the query that's failing in searchUsersInStore
DO $$
BEGIN
    -- Test basic club_members access
    BEGIN
        PERFORM 1 FROM club_members LIMIT 1;
        RAISE NOTICE '✅ club_members table accessible';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ club_members table error: %', SQLERRM;
    END;

    -- Test basic users access
    BEGIN
        PERFORM 1 FROM users LIMIT 1;
        RAISE NOTICE '✅ users table accessible';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ users table error: %', SQLERRM;
    END;

    -- Test the join that's failing
    BEGIN
        PERFORM 1 FROM club_members cm
        JOIN users u ON cm.user_id = u.id
        LIMIT 1;
        RAISE NOTICE '✅ club_members -> users join works';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ club_members -> users join error: %', SQLERRM;
    END;
END $$;

-- =========================
-- 6. Check if users table is in auth schema vs public schema
-- =========================
SELECT 
    table_schema,
    table_name
FROM information_schema.tables
WHERE table_name = 'users'
ORDER BY table_schema;

-- =========================
-- 7. Check for allow_direct_messages column
-- =========================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'users'
    AND column_name = 'allow_direct_messages'
    AND table_schema IN ('public', 'auth');

-- =========================
-- 8. Test PostgREST-style query (what Supabase uses)
-- =========================
-- This simulates the exact query structure that's failing
DO $$
DECLARE
    test_result RECORD;
BEGIN
    -- Test if we can select from club_members with users join
    BEGIN
        SELECT cm.user_id, u.id, u.username, u.displayname
        INTO test_result
        FROM club_members cm
        INNER JOIN users u ON cm.user_id = u.id
        WHERE u.username IS NOT NULL
        LIMIT 1;
        
        IF FOUND THEN
            RAISE NOTICE '✅ PostgREST-style query works: user_id=%, username=%', 
                test_result.user_id, test_result.username;
        ELSE
            RAISE NOTICE '⚠️ PostgREST-style query returns no results (but no error)';
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ PostgREST-style query error: %', SQLERRM;
    END;
END $$;

-- =========================
-- 9. Summary Report
-- =========================
SELECT 
    'DIAGNOSIS COMPLETE' as status,
    'Check the NOTICES above for detailed results' as instructions,
    'Look for foreign key relationships and schema mismatches' as focus_areas;
