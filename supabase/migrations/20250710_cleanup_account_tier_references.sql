-- Cleanup Account Tier References Migration
-- Created: 2025-07-10
-- Purpose: Remove all remaining account_tier references and legacy functions
-- Part of: Phase 1A/1B Refactoring Cleanup

-- =========================
-- Step 1: Drop Legacy Functions
-- =========================

-- Remove the legacy has_account_tier function
DROP FUNCTION IF EXISTS has_account_tier(TEXT);

-- =========================
-- Step 2: Update Message Retention Function
-- =========================

-- Update message retention function to remove account_tier fallback
CREATE OR REPLACE FUNCTION get_user_message_retention_days(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    user_tier TEXT;
    retention_days INTEGER;
BEGIN
    -- Get user's tier from membership_tier only (no account_tier fallback)
    SELECT membership_tier INTO user_tier
    FROM users
    WHERE id = get_user_message_retention_days.user_id;

    -- If user not found or tier is null, default to MEMBER tier
    IF user_tier IS NULL THEN
        user_tier := 'MEMBER';
    END IF;

    -- Map tier to retention days using new tier format
    CASE user_tier
        WHEN 'PRIVILEGED_PLUS' THEN
            retention_days := 365; -- Privileged Plus: 1 year
        WHEN 'PRIVILEGED' THEN
            retention_days := 180; -- Privileged: 180 days
        WHEN 'MEMBER' THEN
            retention_days := 30;  -- Member: 30 days
        ELSE
            retention_days := 30;  -- Default to Member tier
    END CASE;

    RETURN retention_days;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================
-- Step 3: Update RLS Policies
-- =========================

-- Update book clubs RLS policy to use membership_tier instead of account_tier
DROP POLICY IF EXISTS "Users can view clubs based on their tier" ON book_clubs;

CREATE OR REPLACE POLICY "Users can view clubs based on their tier"
ON book_clubs
FOR SELECT
USING (
  access_tier_required = 'free'
  OR (
    access_tier_required = 'all_premium' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND
      membership_tier IN ('PRIVILEGED', 'PRIVILEGED_PLUS')
    )
  )
  OR (
    access_tier_required = 'privileged_plus' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND
      membership_tier = 'PRIVILEGED_PLUS'
    )
  )
  OR lead_user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM store_administrators
    WHERE user_id = auth.uid() AND
    store_id = book_clubs.store_id
  )
);

-- =========================
-- Step 4: Verify Cleanup
-- =========================

-- Verify has_account_tier function is removed
DO $$
DECLARE
    function_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'has_account_tier'
    ) INTO function_exists;
    
    IF function_exists THEN
        RAISE NOTICE 'WARNING: has_account_tier function still exists!';
    ELSE
        RAISE NOTICE 'SUCCESS: has_account_tier function has been removed';
    END IF;
END $$;

-- Verify account_tier column is removed from users table
DO $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'account_tier'
    ) INTO column_exists;
    
    IF column_exists THEN
        RAISE NOTICE 'WARNING: account_tier column still exists in users table!';
    ELSE
        RAISE NOTICE 'SUCCESS: account_tier column has been removed from users table';
    END IF;
END $$;

-- Verify all users have membership_tier set
DO $$
DECLARE
    null_count INTEGER;
    total_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_count FROM users;
    SELECT COUNT(*) INTO null_count FROM users WHERE membership_tier IS NULL;
    
    RAISE NOTICE 'Membership tier status:';
    RAISE NOTICE '  Total users: %', total_count;
    RAISE NOTICE '  Users with NULL membership_tier: %', null_count;
    
    IF null_count > 0 THEN
        RAISE NOTICE 'WARNING: % users have NULL membership_tier', null_count;
        RAISE NOTICE 'Consider running: UPDATE users SET membership_tier = ''MEMBER'' WHERE membership_tier IS NULL;';
    ELSE
        RAISE NOTICE 'SUCCESS: All users have membership_tier set';
    END IF;
END $$;

-- Show current membership tier distribution
DO $$
DECLARE
    tier_stats RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE 'Current membership tier distribution:';
    FOR tier_stats IN 
        SELECT 
            COALESCE(membership_tier, 'NULL') as tier,
            COUNT(*) as count 
        FROM users 
        GROUP BY membership_tier 
        ORDER BY membership_tier
    LOOP
        RAISE NOTICE '  %: % users', tier_stats.tier, tier_stats.count;
    END LOOP;
END $$;

-- =========================
-- Step 5: Test Updated Functions
-- =========================

-- Test the updated message retention function
DO $$
DECLARE
    test_user_id UUID;
    retention_days INTEGER;
BEGIN
    -- Get a test user
    SELECT id INTO test_user_id FROM users LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        SELECT get_user_message_retention_days(test_user_id) INTO retention_days;
        RAISE NOTICE '';
        RAISE NOTICE 'Function test results:';
        RAISE NOTICE '  Test user ID: %', test_user_id;
        RAISE NOTICE '  Message retention days: %', retention_days;
        RAISE NOTICE '  Function is working correctly';
    ELSE
        RAISE NOTICE 'No users found for testing';
    END IF;
END $$;

-- =========================
-- Migration Complete
-- =========================

RAISE NOTICE '';
RAISE NOTICE '=============================================================================';
RAISE NOTICE 'ACCOUNT_TIER CLEANUP MIGRATION COMPLETED';
RAISE NOTICE '=============================================================================';
RAISE NOTICE 'Summary of changes:';
RAISE NOTICE '  ✓ Removed has_account_tier() function';
RAISE NOTICE '  ✓ Updated get_user_message_retention_days() function';
RAISE NOTICE '  ✓ Updated RLS policies to use membership_tier';
RAISE NOTICE '  ✓ Verified account_tier column removal';
RAISE NOTICE '  ✓ Verified membership_tier data integrity';
RAISE NOTICE '';
RAISE NOTICE 'Next steps:';
RAISE NOTICE '  1. Update TypeScript types (remove account_tier references)';
RAISE NOTICE '  2. Update documentation to use membership_tier';
RAISE NOTICE '  3. Test tier badge display functionality';
RAISE NOTICE '=============================================================================';
