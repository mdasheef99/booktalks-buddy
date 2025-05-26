-- RLS Policy Test Script for Direct Messaging
-- Run this in Supabase SQL Editor to test the fixed RLS policies

-- =========================
-- Test Helper Function
-- =========================

-- Test the is_user_conversation_participant function
-- Replace 'test-conversation-id' and 'test-user-id' with actual values
-- SELECT is_user_conversation_participant('test-conversation-id'::uuid, 'test-user-id'::uuid) as is_participant;

-- =========================
-- Test RLS Policies (Run as authenticated user)
-- =========================

-- Test 1: Check if conversation_participants table is accessible without infinite recursion
SELECT 'Testing conversation_participants access' as test;
SELECT COUNT(*) as participant_count FROM conversation_participants;

-- Test 2: Check if user can see their own participation records
-- This should work without recursion
SELECT 'Testing user participation records' as test;
SELECT conversation_id, user_id, last_read_at 
FROM conversation_participants 
WHERE user_id = auth.uid()
LIMIT 5;

-- Test 3: Check if conversations table access works
SELECT 'Testing conversations access' as test;
SELECT COUNT(*) as conversation_count FROM conversations;

-- Test 4: Check if direct_messages table access works
SELECT 'Testing direct_messages access' as test;
SELECT COUNT(*) as message_count FROM direct_messages;

-- =========================
-- Test Policy Logic
-- =========================

-- Test the RLS policy logic manually
-- This should not cause infinite recursion
SELECT 'Testing RLS policy logic' as test;

-- Simulate the policy check (this should work without recursion)
SELECT 
    cp.conversation_id,
    cp.user_id,
    (cp.user_id = auth.uid()) as is_own_record,
    is_user_conversation_participant(cp.conversation_id, auth.uid()) as is_participant
FROM conversation_participants cp
LIMIT 5;

-- =========================
-- Test Conversation Queries
-- =========================

-- Test the type of query that was causing infinite recursion
-- This should now work correctly
SELECT 'Testing conversation participant queries' as test;

-- Get conversations where user is a participant (this was failing before)
SELECT DISTINCT cp.conversation_id
FROM conversation_participants cp
WHERE cp.user_id = auth.uid()
LIMIT 5;

-- Test joining with conversations table
SELECT 
    c.id as conversation_id,
    c.created_at,
    cp.user_id as participant_id
FROM conversations c
JOIN conversation_participants cp ON c.id = cp.conversation_id
WHERE cp.user_id = auth.uid()
LIMIT 5;

-- =========================
-- Test Security
-- =========================

-- Test that users cannot see participants from conversations they're not part of
-- This should return empty results for conversations the user is not in
SELECT 'Testing security - should not see unauthorized participants' as test;

-- This query should only return participants from conversations where the user is also a participant
SELECT 
    cp.conversation_id,
    cp.user_id,
    cp.last_read_at
FROM conversation_participants cp
WHERE cp.conversation_id NOT IN (
    SELECT conversation_id 
    FROM conversation_participants 
    WHERE user_id = auth.uid()
)
LIMIT 5;

-- =========================
-- Performance Test
-- =========================

-- Test that the queries are reasonably fast (should complete quickly)
SELECT 'Performance test - timing conversation queries' as test;

-- Time a typical conversation list query
EXPLAIN (ANALYZE, BUFFERS) 
SELECT cp.conversation_id
FROM conversation_participants cp
WHERE cp.user_id = auth.uid();

-- =========================
-- Verification Summary
-- =========================

SELECT 
    'RLS Policy Test Complete' as status,
    'No infinite recursion errors should have occurred' as result,
    NOW() as tested_at;

-- =========================
-- Expected Results
-- =========================

/*
Expected Results:
1. All queries should complete without "infinite recursion" errors
2. Users should see their own participation records
3. Users should see other participants only in conversations they're part of
4. Queries should complete in reasonable time (< 1 second)
5. No PostgreSQL 42P17 errors should occur

If any query fails with infinite recursion, the RLS policy fix needs adjustment.
*/
