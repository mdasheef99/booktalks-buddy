-- Remove Legacy Account Tier System
-- Created: 2025-01-23
-- Purpose: Remove account_tier column and update related functions

-- =========================
-- Step 1: Remove account_tier column
-- =========================

-- First ensure all users have proper membership_tier
UPDATE users 
SET membership_tier = 'MEMBER' 
WHERE membership_tier IS NULL;

-- Remove the legacy account_tier column
ALTER TABLE users DROP COLUMN IF EXISTS account_tier;

-- =========================
-- Step 2: Update database functions
-- =========================

-- Update message retention function to use only membership_tier
CREATE OR REPLACE FUNCTION get_user_message_retention_days(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    user_tier TEXT;
BEGIN
    -- Get user's tier from membership_tier only
    SELECT membership_tier INTO user_tier
    FROM users
    WHERE id = get_user_message_retention_days.user_id;

    -- If user not found, default to MEMBER tier
    IF user_tier IS NULL THEN
        user_tier := 'MEMBER';
    END IF;

    -- Map tier to retention days
    CASE user_tier
        WHEN 'PRIVILEGED_PLUS' THEN
            RETURN 365; -- Privileged Plus: 1 year
        WHEN 'PRIVILEGED' THEN
            RETURN 180; -- Privileged: 180 days
        ELSE
            RETURN 30; -- Member: 30 days
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove legacy has_account_tier function
DROP FUNCTION IF EXISTS has_account_tier(TEXT);

-- Update membership tier check function to be more robust
CREATE OR REPLACE FUNCTION has_membership_tier_or_higher(user_id UUID, required_tier TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_tier TEXT;
    tier_hierarchy INTEGER;
    required_hierarchy INTEGER;
BEGIN
    -- Get user's membership tier
    SELECT membership_tier INTO user_tier FROM users WHERE id = user_id;

    IF user_tier IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Define tier hierarchy (higher number = higher tier)
    tier_hierarchy := CASE user_tier
        WHEN 'MEMBER' THEN 1
        WHEN 'PRIVILEGED' THEN 2
        WHEN 'PRIVILEGED_PLUS' THEN 3
        ELSE 0
    END;

    required_hierarchy := CASE required_tier
        WHEN 'MEMBER' THEN 1
        WHEN 'PRIVILEGED' THEN 2
        WHEN 'PRIVILEGED_PLUS' THEN 3
        ELSE 0
    END;

    RETURN tier_hierarchy >= required_hierarchy;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================
-- Step 3: Add helpful utility functions
-- =========================

-- Function to get user's current tier
CREATE OR REPLACE FUNCTION get_user_tier(user_id UUID)
RETURNS TEXT AS $$
DECLARE
    user_tier TEXT;
BEGIN
    SELECT membership_tier INTO user_tier FROM users WHERE id = user_id;
    RETURN COALESCE(user_tier, 'MEMBER');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================
-- Step 4: Update any RLS policies that might reference account_tier
-- =========================

-- Note: This is a placeholder - actual RLS policies would need to be identified and updated
-- Example of what might need updating:
-- ALTER POLICY "policy_name" ON table_name USING (has_membership_tier_or_higher(auth.uid(), 'PRIVILEGED'));

-- =========================
-- Verification queries
-- =========================

-- Verify all users have membership_tier set
DO $$
DECLARE
    null_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO null_count FROM users WHERE membership_tier IS NULL;
    IF null_count > 0 THEN
        RAISE NOTICE 'Warning: % users have NULL membership_tier', null_count;
    ELSE
        RAISE NOTICE 'Success: All users have membership_tier set';
    END IF;
END $$;

-- Show tier distribution
DO $$
DECLARE
    tier_stats RECORD;
BEGIN
    RAISE NOTICE 'Membership tier distribution:';
    FOR tier_stats IN 
        SELECT membership_tier, COUNT(*) as count 
        FROM users 
        GROUP BY membership_tier 
        ORDER BY membership_tier
    LOOP
        RAISE NOTICE '  %: % users', tier_stats.membership_tier, tier_stats.count;
    END LOOP;
END $$;
