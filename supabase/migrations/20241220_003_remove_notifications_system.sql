-- Migration: Remove Notifications System
-- Description: Completely removes the notification system from BookConnect
-- Date: 2024-12-20
-- Reason: System was not properly planned and will be reimplemented systematically later

-- Drop triggers first
DROP TRIGGER IF EXISTS create_notification_preferences_trigger ON users;

-- Drop functions
DROP FUNCTION IF EXISTS create_default_notification_preferences();
DROP FUNCTION IF EXISTS cleanup_old_notifications();
DROP FUNCTION IF EXISTS get_unread_notification_count(UUID);
DROP FUNCTION IF EXISTS mark_notifications_as_read(UUID, UUID[]);

-- Drop tables (in reverse dependency order)
DROP TABLE IF EXISTS notification_templates CASCADE;
DROP TABLE IF EXISTS notification_preferences CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;

-- Note: We're keeping event_notifications table as it's part of the club events system
-- and uses a different architecture. This will be handled separately if needed.

-- Revoke permissions (cleanup)
REVOKE ALL ON notifications FROM authenticated;
REVOKE ALL ON notification_preferences FROM authenticated;
REVOKE ALL ON notification_templates FROM authenticated;
REVOKE EXECUTE ON FUNCTION get_unread_notification_count FROM authenticated;
REVOKE EXECUTE ON FUNCTION mark_notifications_as_read FROM authenticated;
