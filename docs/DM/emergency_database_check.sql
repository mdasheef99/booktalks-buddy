-- Emergency Database Check for Direct Messaging 500 Error
-- Run this in Supabase SQL Editor to diagnose the issue

-- =========================
-- 1. Check if tables exist
-- =========================
SELECT 
    'conversations' as table_name,
    EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'conversations'
    ) as table_exists;

SELECT 
    'conversation_participants' as table_name,
    EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'conversation_participants'
    ) as table_exists;

SELECT 
    'direct_messages' as table_name,
    EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'direct_messages'
    ) as table_exists;

-- =========================
-- 2. Check table accessibility
-- =========================
DO $$
BEGIN
    -- Test conversations table
    BEGIN
        PERFORM 1 FROM conversations LIMIT 1;
        RAISE NOTICE '✅ conversations table accessible';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ conversations table error: %', SQLERRM;
    END;

    -- Test conversation_participants table
    BEGIN
        PERFORM 1 FROM conversation_participants LIMIT 1;
        RAISE NOTICE '✅ conversation_participants table accessible';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ conversation_participants table error: %', SQLERRM;
    END;

    -- Test direct_messages table
    BEGIN
        PERFORM 1 FROM direct_messages LIMIT 1;
        RAISE NOTICE '✅ direct_messages table accessible';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ direct_messages table error: %', SQLERRM;
    END;
END $$;

-- =========================
-- 3. Check RLS status
-- =========================
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('conversations', 'conversation_participants', 'direct_messages')
    AND schemaname = 'public';

-- =========================
-- 4. Check RLS policies
-- =========================
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('conversations', 'conversation_participants', 'direct_messages');

-- =========================
-- 5. Test specific user query
-- =========================
-- Replace 'efdf6150-d861-4f2c-b59c-5d71c115493b' with the actual failing user ID
DO $$
DECLARE
    test_user_id UUID := 'efdf6150-d861-4f2c-b59c-5d71c115493b';
    result_count INTEGER;
BEGIN
    -- Check if user exists
    SELECT COUNT(*) INTO result_count FROM users WHERE id = test_user_id;
    RAISE NOTICE 'User exists: % (count: %)', CASE WHEN result_count > 0 THEN 'YES' ELSE 'NO' END, result_count;
    
    -- Test the failing query
    BEGIN
        SELECT COUNT(*) INTO result_count 
        FROM conversation_participants 
        WHERE user_id = test_user_id;
        RAISE NOTICE '✅ conversation_participants query successful, count: %', result_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ conversation_participants query failed: %', SQLERRM;
    END;
END $$;

-- =========================
-- 6. Check database functions
-- =========================
SELECT 
    proname as function_name,
    pg_get_function_result(oid) as return_type
FROM pg_proc 
WHERE proname IN (
    'get_user_message_retention_days',
    'set_message_retention',
    'is_user_conversation_participant'
)
ORDER BY proname;

-- =========================
-- 7. Summary Report
-- =========================
SELECT 
    'DIAGNOSIS COMPLETE' as status,
    'Check the NOTICES above for detailed results' as instructions;
