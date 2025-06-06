-- Debug User Permissions and Account Tier
-- Created: 2024-12-19
-- Purpose: Diagnose permission issues for Direct Messaging

-- =========================
-- User Account Tier Analysis
-- =========================

DO $$
DECLARE
    user_record RECORD;
    user_count INTEGER;
BEGIN
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'USER ACCOUNT TIER ANALYSIS';
    RAISE NOTICE '=============================================================================';
    
    -- Count total users
    SELECT COUNT(*) INTO user_count FROM users;
    RAISE NOTICE 'Total users in system: %', user_count;
    
    -- Show account tier distribution
    RAISE NOTICE '';
    RAISE NOTICE 'Account Tier Distribution:';
    FOR user_record IN 
        SELECT 
            COALESCE(account_tier, 'NULL') as tier,
            COUNT(*) as count
        FROM users 
        GROUP BY account_tier 
        ORDER BY count DESC
    LOOP
        RAISE NOTICE '  %: % users', user_record.tier, user_record.count;
    END LOOP;
    
    -- Show membership tier distribution (if column exists)
    BEGIN
        RAISE NOTICE '';
        RAISE NOTICE 'Membership Tier Distribution:';
        FOR user_record IN 
            SELECT 
                COALESCE(membership_tier, 'NULL') as tier,
                COUNT(*) as count
            FROM users 
            GROUP BY membership_tier 
            ORDER BY count DESC
        LOOP
            RAISE NOTICE '  %: % users', user_record.tier, user_record.count;
        END LOOP;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  membership_tier column does not exist';
    END;
    
    RAISE NOTICE '';
    RAISE NOTICE 'Sample User Records:';
    FOR user_record IN 
        SELECT 
            id,
            email,
            username,
            COALESCE(account_tier, 'NULL') as account_tier,
            COALESCE(membership_tier, 'NULL') as membership_tier,
            created_at
        FROM users 
        ORDER BY created_at DESC
        LIMIT 5
    LOOP
        RAISE NOTICE '  User: % | Email: % | Account: % | Membership: %', 
            user_record.username, 
            user_record.email, 
            user_record.account_tier, 
            user_record.membership_tier;
    END LOOP;
END $$;

-- =========================
-- Find Privileged+ Users
-- =========================

DO $$
DECLARE
    user_record RECORD;
    privileged_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'PRIVILEGED+ USERS ANALYSIS';
    RAISE NOTICE '=============================================================================';
    
    -- Count privileged+ users
    SELECT COUNT(*) INTO privileged_count 
    FROM users 
    WHERE account_tier = 'privileged_plus' 
       OR membership_tier = 'PRIVILEGED_PLUS';
    
    RAISE NOTICE 'Total Privileged+ users: %', privileged_count;
    
    -- Show all privileged+ users
    IF privileged_count > 0 THEN
        RAISE NOTICE '';
        RAISE NOTICE 'Privileged+ User Details:';
        FOR user_record IN 
            SELECT 
                id,
                email,
                username,
                account_tier,
                membership_tier,
                created_at
            FROM users 
            WHERE account_tier = 'privileged_plus' 
               OR membership_tier = 'PRIVILEGED_PLUS'
            ORDER BY created_at DESC
        LOOP
            RAISE NOTICE '  ID: % | Username: % | Email: % | Account: % | Membership: %', 
                user_record.id,
                user_record.username, 
                user_record.email, 
                user_record.account_tier, 
                user_record.membership_tier;
        END LOOP;
    ELSE
        RAISE NOTICE 'No Privileged+ users found. This might be the issue!';
        RAISE NOTICE '';
        RAISE NOTICE 'To fix this, you need to upgrade a user account:';
        RAISE NOTICE 'UPDATE users SET account_tier = ''privileged_plus'' WHERE email = ''your-email@example.com'';';
    END IF;
END $$;

-- =========================
-- Test Messaging Entitlements Logic
-- =========================

DO $$
DECLARE
    test_user_id UUID;
    test_account_tier TEXT;
    test_membership_tier TEXT;
    can_initiate BOOLEAN := false;
    can_send BOOLEAN := false;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'MESSAGING ENTITLEMENTS TEST';
    RAISE NOTICE '=============================================================================';
    
    -- Get first user for testing
    SELECT id, account_tier, membership_tier 
    INTO test_user_id, test_account_tier, test_membership_tier
    FROM users 
    LIMIT 1;
    
    IF test_user_id IS NULL THEN
        RAISE NOTICE 'No users found for testing';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Testing with user: %', test_user_id;
    RAISE NOTICE 'Account tier: %', COALESCE(test_account_tier, 'NULL');
    RAISE NOTICE 'Membership tier: %', COALESCE(test_membership_tier, 'NULL');
    RAISE NOTICE '';
    
    -- Simulate entitlements calculation logic
    RAISE NOTICE 'Entitlements Analysis:';
    
    -- Check MEMBER entitlements (everyone gets these)
    RAISE NOTICE '✅ MEMBER entitlements: Always granted';
    
    -- Check PRIVILEGED entitlements
    IF test_membership_tier = 'PRIVILEGED' OR test_membership_tier = 'PRIVILEGED_PLUS' OR
       test_account_tier = 'privileged' OR test_account_tier = 'privileged_plus' THEN
        RAISE NOTICE '✅ PRIVILEGED entitlements: Granted';
        RAISE NOTICE '  - CAN_INITIATE_DIRECT_MESSAGES: YES';
        can_initiate := true;
    ELSE
        RAISE NOTICE '❌ PRIVILEGED entitlements: NOT granted';
        RAISE NOTICE '  - CAN_INITIATE_DIRECT_MESSAGES: NO';
    END IF;
    
    -- Check PRIVILEGED_PLUS entitlements
    IF test_membership_tier = 'PRIVILEGED_PLUS' OR test_account_tier = 'privileged_plus' THEN
        RAISE NOTICE '✅ PRIVILEGED_PLUS entitlements: Granted';
        RAISE NOTICE '  - CAN_SEND_DIRECT_MESSAGES: YES';
        can_send := true;
    ELSE
        RAISE NOTICE '❌ PRIVILEGED_PLUS entitlements: NOT granted';
        RAISE NOTICE '  - CAN_SEND_DIRECT_MESSAGES: NO';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE 'Final Permission Results:';
    RAISE NOTICE '  Can initiate conversations: %', can_initiate;
    RAISE NOTICE '  Can send direct messages: %', can_send;
    
    IF NOT can_initiate AND NOT can_send THEN
        RAISE NOTICE '';
        RAISE NOTICE '🚨 ISSUE IDENTIFIED: User has no messaging permissions!';
        RAISE NOTICE '';
        RAISE NOTICE 'SOLUTION: Upgrade the user account tier:';
        RAISE NOTICE 'For basic messaging (can start conversations):';
        RAISE NOTICE '  UPDATE users SET account_tier = ''privileged'' WHERE id = ''%'';', test_user_id;
        RAISE NOTICE '';
        RAISE NOTICE 'For full messaging (can start + send to anyone):';
        RAISE NOTICE '  UPDATE users SET account_tier = ''privileged_plus'' WHERE id = ''%'';', test_user_id;
    END IF;
END $$;

-- =========================
-- Show Current RLS Policies
-- =========================

SELECT 
    'Current RLS Policies for Messaging Tables:' as info;

SELECT 
    tablename,
    policyname,
    cmd as operation,
    permissive,
    with_check
FROM pg_policies 
WHERE tablename IN ('conversations', 'conversation_participants', 'direct_messages')
ORDER BY tablename, policyname;

-- =========================
-- Provide Fix Commands
-- =========================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'QUICK FIX COMMANDS';
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'If you want to upgrade your own account to test messaging:';
    RAISE NOTICE '';
    RAISE NOTICE '1. Find your user ID:';
    RAISE NOTICE '   SELECT id, email, account_tier FROM users WHERE email = ''your-email@domain.com'';';
    RAISE NOTICE '';
    RAISE NOTICE '2. Upgrade to Privileged+ (full messaging):';
    RAISE NOTICE '   UPDATE users SET account_tier = ''privileged_plus'' WHERE email = ''your-email@domain.com'';';
    RAISE NOTICE '';
    RAISE NOTICE '3. Or upgrade to Privileged (basic messaging):';
    RAISE NOTICE '   UPDATE users SET account_tier = ''privileged'' WHERE email = ''your-email@domain.com'';';
    RAISE NOTICE '';
    RAISE NOTICE 'After upgrading, clear your browser cache/session storage and try again.';
    RAISE NOTICE '=============================================================================';
END $$;
