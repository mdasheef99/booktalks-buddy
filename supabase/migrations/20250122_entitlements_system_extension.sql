-- Entitlements System Extension Migration
-- Generated on 2025-01-22
-- Phase 1: Foundation - Database Schema Updates

-- Enable pgcrypto for UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================
-- Update users table membership tiers
-- =========================

-- First, update the existing account_tier column to use new naming convention
-- Map: 'free' -> 'MEMBER', 'privileged' -> 'PRIVILEGED', 'privileged_plus' -> 'PRIVILEGED_PLUS'

-- Step 1: Add new membership_tier column
ALTER TABLE users
ADD COLUMN IF NOT EXISTS membership_tier TEXT
CHECK (membership_tier IN ('MEMBER', 'PRIVILEGED', 'PRIVILEGED_PLUS'))
DEFAULT 'MEMBER';

-- Step 2: Migrate existing data from account_tier to membership_tier
UPDATE users
SET membership_tier = CASE
    WHEN account_tier = 'free' THEN 'MEMBER'
    WHEN account_tier = 'privileged' THEN 'PRIVILEGED'
    WHEN account_tier = 'privileged_plus' THEN 'PRIVILEGED_PLUS'
    ELSE 'MEMBER'
END
WHERE membership_tier IS NULL OR membership_tier = 'MEMBER';

-- Step 3: Make membership_tier NOT NULL after migration
ALTER TABLE users ALTER COLUMN membership_tier SET NOT NULL;

-- =========================
-- Create role_activity table for tracking role usage
-- =========================
CREATE TABLE IF NOT EXISTS role_activity (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role_type TEXT NOT NULL CHECK (role_type IN ('club_lead', 'club_moderator', 'store_owner', 'store_manager', 'platform_owner')),
    context_id UUID DEFAULT '00000000-0000-0000-0000-000000000000'::UUID, -- Use default UUID for platform-wide roles
    context_type TEXT CHECK (context_type IN ('platform', 'store', 'club')),
    last_active TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (user_id, role_type, context_id)
);

-- =========================
-- Add indexes for performance
-- =========================

-- Index for role_activity lookups
CREATE INDEX IF NOT EXISTS idx_role_activity_user_id ON role_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_role_activity_role_type ON role_activity(role_type);
CREATE INDEX IF NOT EXISTS idx_role_activity_context ON role_activity(context_id, context_type);
CREATE INDEX IF NOT EXISTS idx_role_activity_last_active ON role_activity(last_active);

-- Index for membership_tier lookups
CREATE INDEX IF NOT EXISTS idx_users_membership_tier ON users(membership_tier);

-- Index for store_administrators
CREATE INDEX IF NOT EXISTS idx_store_administrators_user_role ON store_administrators(user_id, role);

-- Index for club_moderators
CREATE INDEX IF NOT EXISTS idx_club_moderators_user_club ON club_moderators(user_id, club_id);

-- =========================
-- Create helper functions for role checking
-- =========================

-- Function to check if user has specific membership tier or higher
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

-- Function to update role activity
CREATE OR REPLACE FUNCTION update_role_activity(
    p_user_id UUID,
    p_role_type TEXT,
    p_context_id UUID DEFAULT '00000000-0000-0000-0000-000000000000'::UUID,
    p_context_type TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    INSERT INTO role_activity (user_id, role_type, context_id, context_type, last_active)
    VALUES (p_user_id, p_role_type, COALESCE(p_context_id, '00000000-0000-0000-0000-000000000000'::UUID), p_context_type, now())
    ON CONFLICT (user_id, role_type, context_id)
    DO UPDATE SET last_active = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================
-- Update existing RLS policies to use new membership_tier
-- =========================

-- Note: We'll keep the existing account_tier column for backward compatibility
-- during the transition period, but new logic should use membership_tier

-- =========================
-- Data validation and cleanup
-- =========================

-- Ensure all users have a valid membership_tier
UPDATE users
SET membership_tier = 'MEMBER'
WHERE membership_tier IS NULL;

-- Validate that all book clubs have lead_user_id
DO $$
DECLARE
    club_record RECORD;
BEGIN
    FOR club_record IN
        SELECT id, created_at
        FROM book_clubs
        WHERE lead_user_id IS NULL
        LIMIT 10 -- Process in batches to avoid long locks
    LOOP
        -- For clubs without lead_user_id, we'll need to handle this in the application layer
        -- Log this for manual review
        RAISE NOTICE 'Club % needs lead_user_id assignment', club_record.id;
    END LOOP;
END $$;

-- =========================
-- Comments for documentation
-- =========================

COMMENT ON TABLE role_activity IS 'Tracks when users last performed actions in their various roles';
COMMENT ON COLUMN role_activity.context_id IS 'UUID of the context (store_id, club_id, etc.). NULL for platform-wide roles';
COMMENT ON COLUMN role_activity.context_type IS 'Type of context: platform, store, or club';
COMMENT ON COLUMN users.membership_tier IS 'User membership tier using new naming convention: MEMBER, PRIVILEGED, PRIVILEGED_PLUS';

COMMENT ON FUNCTION has_membership_tier_or_higher(UUID, TEXT) IS 'Checks if user has the specified membership tier or higher';
COMMENT ON FUNCTION update_role_activity(UUID, TEXT, UUID, TEXT) IS 'Updates or inserts role activity tracking record';
