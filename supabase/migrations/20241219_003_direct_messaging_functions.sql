-- Direct Messaging Functions and Triggers Migration
-- Created: 2024-12-19
-- Purpose: Implement message retention policies and cleanup functions

-- =========================
-- Message Retention Function
-- =========================

-- Function to determine user tier and set retention expiration
CREATE OR REPLACE FUNCTION get_user_message_retention_days(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    user_tier TEXT;
    retention_days INTEGER;
BEGIN
    -- Get user's tier from the users table
    -- Use membership_tier if available, fallback to account_tier
    SELECT COALESCE(membership_tier, account_tier, 'free') INTO user_tier
    FROM users
    WHERE id = get_user_message_retention_days.user_id;

    -- If user not found, default to free tier
    IF user_tier IS NULL THEN
        user_tier := 'free';
    END IF;

    -- Map tier to retention days
    CASE LOWER(user_tier)
        WHEN 'privileged_plus', 'PRIVILEGED_PLUS' THEN
            RETURN 365; -- Privileged Plus: 1 year
        WHEN 'privileged', 'PRIVILEGED' THEN
            RETURN 180; -- Privileged: 180 days
        ELSE
            RETURN 30; -- Free/Member: 30 days
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to set retention expiration on message insert
CREATE OR REPLACE FUNCTION set_message_retention()
RETURNS TRIGGER AS $$
DECLARE
    retention_days INTEGER;
BEGIN
    -- Get retention period for sender
    retention_days := get_user_message_retention_days(NEW.sender_id);

    -- Set retention expiration date
    NEW.retention_expires_at := NEW.sent_at + (retention_days || ' days')::INTERVAL;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =========================
-- Message Cleanup Functions
-- =========================

-- Function to soft delete expired messages (first step)
CREATE OR REPLACE FUNCTION soft_delete_expired_messages()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE direct_messages
    SET is_deleted = true, deleted_at = NOW()
    WHERE retention_expires_at < NOW()
    AND is_deleted = false;

    GET DIAGNOSTICS updated_count = ROW_COUNT;

    -- Log the cleanup action (optional - only if system_logs table exists)
    BEGIN
        INSERT INTO system_logs (action, details, created_at)
        VALUES (
            'soft_delete_expired_messages',
            jsonb_build_object('messages_soft_deleted', updated_count),
            NOW()
        );
    EXCEPTION
        WHEN undefined_table THEN
            -- system_logs table doesn't exist, continue without logging
            NULL;
    END;

    RETURN updated_count;
EXCEPTION
    WHEN OTHERS THEN
        -- Return the count even if other errors occur
        RETURN COALESCE(updated_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to permanently delete soft-deleted messages (second step)
CREATE OR REPLACE FUNCTION cleanup_expired_messages()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Only delete messages that have been soft deleted for at least 7 days
    -- This provides a grace period for recovery
    DELETE FROM direct_messages
    WHERE is_deleted = true
    AND deleted_at < NOW() - INTERVAL '7 days';

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    -- Log the cleanup action (optional - only if system_logs table exists)
    BEGIN
        INSERT INTO system_logs (action, details, created_at)
        VALUES (
            'cleanup_expired_messages',
            jsonb_build_object('messages_permanently_deleted', deleted_count),
            NOW()
        );
    EXCEPTION
        WHEN undefined_table THEN
            -- system_logs table doesn't exist, continue without logging
            NULL;
    END;

    RETURN deleted_count;
EXCEPTION
    WHEN OTHERS THEN
        -- Return the count even if other errors occur
        RETURN COALESCE(deleted_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================
-- Utility Functions
-- =========================

-- Function to get message retention info for a user
CREATE OR REPLACE FUNCTION get_user_retention_info(user_id UUID)
RETURNS TABLE(
    tier TEXT,
    retention_days INTEGER,
    expires_at TIMESTAMPTZ
) AS $$
DECLARE
    days INTEGER;
    tier_name TEXT;
BEGIN
    days := get_user_message_retention_days(user_id);

    CASE days
        WHEN 365 THEN tier_name := 'privileged_plus';
        WHEN 180 THEN tier_name := 'privileged';
        ELSE tier_name := 'free';
    END CASE;

    RETURN QUERY SELECT
        tier_name,
        days,
        NOW() + (days || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate unread message count for a conversation
CREATE OR REPLACE FUNCTION get_unread_message_count(
    conversation_id UUID,
    user_id UUID
)
RETURNS INTEGER AS $$
DECLARE
    last_read TIMESTAMPTZ;
    unread_count INTEGER;
BEGIN
    -- Get user's last read timestamp
    SELECT last_read_at INTO last_read
    FROM conversation_participants
    WHERE conversation_participants.conversation_id = get_unread_message_count.conversation_id
    AND conversation_participants.user_id = get_unread_message_count.user_id;

    IF last_read IS NULL THEN
        RETURN 0;
    END IF;

    -- Count messages sent after last read time (excluding own messages)
    SELECT COUNT(*) INTO unread_count
    FROM direct_messages
    WHERE direct_messages.conversation_id = get_unread_message_count.conversation_id
    AND sent_at > last_read
    AND is_deleted = false
    AND sender_id != get_unread_message_count.user_id;

    RETURN COALESCE(unread_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================
-- Create Triggers
-- =========================

-- Trigger to automatically set retention on message insert
DROP TRIGGER IF EXISTS set_message_retention_trigger ON direct_messages;
CREATE TRIGGER set_message_retention_trigger
    BEFORE INSERT ON direct_messages
    FOR EACH ROW
    EXECUTE FUNCTION set_message_retention();

-- =========================
-- Verification
-- =========================

DO $$
BEGIN
    -- Test that functions were created
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_message_retention') THEN
        RAISE EXCEPTION 'set_message_retention function was not created';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'soft_delete_expired_messages') THEN
        RAISE EXCEPTION 'soft_delete_expired_messages function was not created';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'cleanup_expired_messages') THEN
        RAISE EXCEPTION 'cleanup_expired_messages function was not created';
    END IF;

    -- Test that trigger was created
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_message_retention_trigger') THEN
        RAISE EXCEPTION 'set_message_retention_trigger was not created';
    END IF;

    RAISE NOTICE 'Direct messaging functions and triggers created successfully';
END $$;
