-- Direct Messaging Migration Verification Script
-- Run this in Supabase SQL Editor to verify the database state

-- =========================
-- Check if tables exist
-- =========================
SELECT
    'conversations' as table_name,
    EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'conversations'
    ) as exists;

SELECT
    'conversation_participants' as table_name,
    EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'conversation_participants'
    ) as exists;

SELECT
    'direct_messages' as table_name,
    EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'direct_messages'
    ) as exists;

-- =========================
-- Check table structures
-- =========================
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'conversations'
ORDER BY ordinal_position;

SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'conversation_participants'
ORDER BY ordinal_position;

SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'direct_messages'
ORDER BY ordinal_position;

-- =========================
-- Check foreign key constraints
-- =========================
SELECT
    tc.constraint_name,
    tc.table_name,
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
    AND tc.table_name IN ('conversations', 'conversation_participants', 'direct_messages');

-- =========================
-- Check RLS policies
-- =========================
SELECT
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename IN ('conversations', 'conversation_participants', 'direct_messages')
ORDER BY tablename, policyname;

-- =========================
-- Check if RLS is enabled
-- =========================
SELECT
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('conversations', 'conversation_participants', 'direct_messages');

-- =========================
-- Check database functions
-- =========================
SELECT
    proname as function_name,
    pg_get_function_result(oid) as return_type,
    pg_get_function_arguments(oid) as arguments
FROM pg_proc
WHERE proname IN (
    'get_user_message_retention_days',
    'set_message_retention',
    'soft_delete_expired_messages',
    'cleanup_expired_messages',
    'get_user_retention_info',
    'get_unread_message_count',
    'is_user_conversation_participant'
);

-- =========================
-- Check triggers
-- =========================
SELECT
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_table IN ('conversations', 'conversation_participants', 'direct_messages');

-- =========================
-- Test basic queries
-- =========================

-- Test conversation_participants table access
SELECT 'Testing conversation_participants access' as test;
SELECT COUNT(*) as participant_count FROM conversation_participants;

-- Test conversations table access
SELECT 'Testing conversations access' as test;
SELECT COUNT(*) as conversation_count FROM conversations;

-- Test direct_messages table access
SELECT 'Testing direct_messages access' as test;
SELECT COUNT(*) as message_count FROM direct_messages;

-- Test users table access (for tier checking)
SELECT 'Testing users table access' as test;
SELECT COUNT(*) as user_count FROM users;

-- =========================
-- Test database functions
-- =========================

-- Test get_user_message_retention_days function
-- Replace 'test-user-id' with an actual user ID from your users table
-- SELECT get_user_message_retention_days('test-user-id'::uuid) as retention_days;

-- Test get_unread_message_count function
-- Replace with actual conversation and user IDs
-- SELECT get_unread_message_count('test-conversation-id'::uuid, 'test-user-id'::uuid) as unread_count;

-- =========================
-- Summary
-- =========================
SELECT
    'Migration Verification Complete' as status,
    NOW() as checked_at;
