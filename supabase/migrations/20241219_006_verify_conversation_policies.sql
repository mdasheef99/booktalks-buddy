-- Verify and Fix Conversation Creation Policies
-- Created: 2024-12-19
-- Purpose: Check existing policies and fix any issues without duplicating

-- =========================
-- Check current policy status
-- =========================

DO $$
DECLARE
    policy_count INTEGER;
    test_user_id UUID;
    test_store_id UUID;
    test_conversation_id UUID;
BEGIN
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'Checking Current RLS Policy Status';
    RAISE NOTICE '=============================================================================';
    
    -- Check conversations table policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename = 'conversations';
    
    RAISE NOTICE 'Conversations table has % policies', policy_count;
    
    -- List all conversation policies
    FOR policy_count IN 
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'conversations'
    LOOP
        RAISE NOTICE 'Policy found: %', (
            SELECT policyname FROM pg_policies 
            WHERE tablename = 'conversations' 
            LIMIT 1 OFFSET (policy_count - 1)
        );
    END LOOP;
    
    -- Check conversation_participants table policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename = 'conversation_participants';
    
    RAISE NOTICE 'Conversation_participants table has % policies', policy_count;
    
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'Testing Conversation Creation';
    RAISE NOTICE '=============================================================================';
    
    -- Get test data
    SELECT id INTO test_user_id FROM users LIMIT 1;
    SELECT id INTO test_store_id FROM stores LIMIT 1;
    
    IF test_user_id IS NULL THEN
        RAISE NOTICE '⚠️ No users found for testing';
        RETURN;
    END IF;
    
    IF test_store_id IS NULL THEN
        RAISE NOTICE '⚠️ No stores found for testing';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Using test user: %', test_user_id;
    RAISE NOTICE 'Using test store: %', test_store_id;
    
    -- Test conversation creation
    BEGIN
        -- Simulate authenticated user context
        PERFORM set_config('request.jwt.claims', json_build_object('sub', test_user_id)::text, true);
        
        -- Test conversation creation
        INSERT INTO conversations (store_id) 
        VALUES (test_store_id) 
        RETURNING id INTO test_conversation_id;
        
        RAISE NOTICE '✅ Conversation creation test PASSED: %', test_conversation_id;
        
        -- Test adding participants
        BEGIN
            INSERT INTO conversation_participants (conversation_id, user_id)
            VALUES (test_conversation_id, test_user_id);
            
            RAISE NOTICE '✅ Participant addition test PASSED';
            
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '❌ Participant addition test FAILED: %', SQLERRM;
        END;
        
        -- Clean up test conversation
        DELETE FROM conversation_participants WHERE conversation_id = test_conversation_id;
        DELETE FROM conversations WHERE id = test_conversation_id;
        RAISE NOTICE '✅ Test cleanup completed';
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Conversation creation test FAILED: %', SQLERRM;
        RAISE NOTICE 'Error code: %', SQLSTATE;
        
        -- If creation failed due to RLS, try to fix it
        IF SQLSTATE = '42501' THEN
            RAISE NOTICE 'RLS policy violation detected. Attempting to fix...';
            
            -- Drop and recreate the policy if it's not working
            BEGIN
                DROP POLICY IF EXISTS "Authenticated users can create conversations" ON conversations;
                
                CREATE POLICY "Authenticated users can create conversations" ON conversations
                FOR INSERT WITH CHECK (
                    auth.uid() IS NOT NULL
                );
                
                RAISE NOTICE '✅ Recreated conversation creation policy';
                
                -- Test again
                INSERT INTO conversations (store_id) 
                VALUES (test_store_id) 
                RETURNING id INTO test_conversation_id;
                
                RAISE NOTICE '✅ Conversation creation test PASSED after policy fix: %', test_conversation_id;
                
                -- Clean up
                DELETE FROM conversations WHERE id = test_conversation_id;
                
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE '❌ Policy fix attempt FAILED: %', SQLERRM;
            END;
        END IF;
    END;
    
    -- Reset the config
    PERFORM set_config('request.jwt.claims', NULL, true);
    
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'Policy Verification Complete';
    RAISE NOTICE '=============================================================================';
END $$;

-- =========================
-- Additional diagnostics
-- =========================

-- Show all current policies for messaging tables
SELECT 
    schemaname,
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

-- Check if RLS is enabled
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('conversations', 'conversation_participants', 'direct_messages')
ORDER BY tablename;
