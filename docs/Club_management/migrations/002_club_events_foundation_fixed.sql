-- =====================================================
-- Club Management Phase 3 - Events Integration Database Setup (FIXED)
-- Migration: 002_club_events_foundation_fixed.sql
-- Purpose: Create club meetings and event notification tables
-- Phase: 3 - Events Integration (Week 5)
--
-- FIXES:
-- - Properly handles existing function updates with DROP FUNCTION
-- - Ensures idempotent execution
-- - Self-contained with all dependencies
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. Club Meetings Table
-- =====================================================

-- Create club_meetings table for club-specific meetings
CREATE TABLE IF NOT EXISTS club_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES book_clubs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  meeting_type TEXT DEFAULT 'discussion' CHECK (meeting_type IN ('discussion', 'social', 'planning', 'author_event', 'other')),
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  virtual_link TEXT,
  max_attendees INTEGER,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern JSONB,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Constraints
  CONSTRAINT club_meetings_duration_positive CHECK (duration_minutes > 0),
  CONSTRAINT club_meetings_max_attendees_positive CHECK (max_attendees IS NULL OR max_attendees > 0),
  CONSTRAINT club_meetings_scheduled_future CHECK (scheduled_at > created_at)
);

-- =====================================================
-- 2. Club Event Notifications Table
-- =====================================================

-- Create club_event_notifications table for event notifications
CREATE TABLE IF NOT EXISTS club_event_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES book_clubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  meeting_id UUID REFERENCES club_meetings(id) ON DELETE CASCADE,
  notification_type TEXT DEFAULT 'meeting_created' CHECK (notification_type IN ('meeting_created', 'meeting_updated', 'meeting_cancelled', 'meeting_reminder')),
  title TEXT NOT NULL,
  message TEXT,
  is_dismissed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  dismissed_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT club_notifications_dismissed_logic CHECK (
    (is_dismissed = false AND dismissed_at IS NULL) OR
    (is_dismissed = true AND dismissed_at IS NOT NULL)
  )
);

-- =====================================================
-- 3. Performance Indexes
-- =====================================================

-- Indexes for club_meetings
CREATE INDEX IF NOT EXISTS idx_club_meetings_club_id ON club_meetings(club_id);
CREATE INDEX IF NOT EXISTS idx_club_meetings_scheduled_at ON club_meetings(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_club_meetings_club_scheduled ON club_meetings(club_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_club_meetings_created_by ON club_meetings(created_by);
CREATE INDEX IF NOT EXISTS idx_club_meetings_type ON club_meetings(meeting_type);

-- Indexes for club_event_notifications
CREATE INDEX IF NOT EXISTS idx_club_notifications_user_club ON club_event_notifications(user_id, club_id, is_dismissed);
CREATE INDEX IF NOT EXISTS idx_club_notifications_created ON club_event_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_club_notifications_meeting ON club_event_notifications(meeting_id);
CREATE INDEX IF NOT EXISTS idx_club_notifications_type ON club_event_notifications(notification_type);

-- =====================================================
-- 4. Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS on club_meetings
ALTER TABLE club_meetings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Club members can view meetings" ON club_meetings;
DROP POLICY IF EXISTS "Club leads can manage meetings" ON club_meetings;
DROP POLICY IF EXISTS "Moderators can manage meetings" ON club_meetings;

-- Policy: Club members can view meetings for their clubs
CREATE POLICY "Club members can view meetings" ON club_meetings
  FOR SELECT USING (
    club_id IN (
      SELECT club_id FROM club_members
      WHERE user_id = auth.uid() AND role != 'pending'
    )
  );

-- Policy: Club leads and moderators with meeting access can manage meetings
CREATE POLICY "Club leads can manage meetings" ON club_meetings
  FOR ALL USING (
    club_id IN (
      SELECT club_id FROM club_members
      WHERE user_id = auth.uid() AND role = 'lead'
    )
  );

-- Policy: Moderators with meeting management access can manage meetings
CREATE POLICY "Moderators can manage meetings" ON club_meetings
  FOR ALL USING (
    club_id IN (
      SELECT cm.club_id FROM club_moderators cm
      WHERE cm.user_id = auth.uid()
        AND cm.is_active = true
        AND cm.meeting_management_access = true
    )
  );

-- Enable RLS on club_event_notifications
ALTER TABLE club_event_notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own notifications" ON club_event_notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON club_event_notifications;
DROP POLICY IF EXISTS "Club leads can create notifications" ON club_event_notifications;
DROP POLICY IF EXISTS "Moderators can create notifications" ON club_event_notifications;

-- Policy: Users can view their own notifications
CREATE POLICY "Users can view their own notifications" ON club_event_notifications
  FOR SELECT USING (user_id = auth.uid());

-- Policy: Users can update their own notifications (dismiss)
CREATE POLICY "Users can update their own notifications" ON club_event_notifications
  FOR UPDATE USING (user_id = auth.uid());

-- Policy: Club leads can create notifications for their clubs
CREATE POLICY "Club leads can create notifications" ON club_event_notifications
  FOR INSERT WITH CHECK (
    club_id IN (
      SELECT club_id FROM club_members
      WHERE user_id = auth.uid() AND role = 'lead'
    )
  );

-- Policy: Moderators with meeting access can create notifications
CREATE POLICY "Moderators can create notifications" ON club_event_notifications
  FOR INSERT WITH CHECK (
    club_id IN (
      SELECT cm.club_id FROM club_moderators cm
      WHERE cm.user_id = auth.uid()
        AND cm.is_active = true
        AND cm.meeting_management_access = true
    )
  );

-- =====================================================
-- 5. Database Functions for Meeting Management
-- =====================================================

-- Function to get club meetings with optional filters
-- Drop existing function first to ensure clean recreation
DROP FUNCTION IF EXISTS get_club_meetings(UUID, BOOLEAN, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION get_club_meetings(
  p_club_id UUID,
  p_upcoming_only BOOLEAN DEFAULT false,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  club_id UUID,
  title TEXT,
  description TEXT,
  meeting_type TEXT,
  scheduled_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  virtual_link TEXT,
  max_attendees INTEGER,
  is_recurring BOOLEAN,
  recurrence_pattern JSONB,
  created_by UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  creator_username TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cm.id,
    cm.club_id,
    cm.title,
    cm.description,
    cm.meeting_type,
    cm.scheduled_at,
    cm.duration_minutes,
    cm.virtual_link,
    cm.max_attendees,
    cm.is_recurring,
    cm.recurrence_pattern,
    cm.created_by,
    cm.created_at,
    cm.updated_at,
    COALESCE(p.username, p.email) as creator_username
  FROM club_meetings cm
  LEFT JOIN auth.users au ON cm.created_by = au.id
  LEFT JOIN profiles p ON au.id = p.id
  WHERE cm.club_id = p_club_id
    AND (NOT p_upcoming_only OR cm.scheduled_at > NOW())
  ORDER BY cm.scheduled_at ASC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create meeting notifications for all club members
-- Drop existing function first to ensure clean recreation
DROP FUNCTION IF EXISTS create_meeting_notifications(UUID, UUID, TEXT);

CREATE OR REPLACE FUNCTION create_meeting_notifications(
  p_meeting_id UUID,
  p_club_id UUID,
  p_notification_type TEXT DEFAULT 'meeting_created'
)
RETURNS VOID AS $$
DECLARE
  v_meeting RECORD;
  v_member RECORD;
  v_title TEXT;
  v_message TEXT;
BEGIN
  -- Get meeting details
  SELECT * INTO v_meeting FROM club_meetings WHERE id = p_meeting_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Meeting not found: %', p_meeting_id;
  END IF;

  -- Generate notification content based on type
  CASE p_notification_type
    WHEN 'meeting_created' THEN
      v_title := 'New Meeting: ' || v_meeting.title;
      v_message := 'A new meeting has been scheduled for ' ||
                   to_char(v_meeting.scheduled_at, 'FMDay, FMMonth DD, YYYY at HH12:MI AM');
    WHEN 'meeting_updated' THEN
      v_title := 'Meeting Updated: ' || v_meeting.title;
      v_message := 'Meeting details have been updated. Check the latest information.';
    WHEN 'meeting_cancelled' THEN
      v_title := 'Meeting Cancelled: ' || v_meeting.title;
      v_message := 'This meeting has been cancelled.';
    WHEN 'meeting_reminder' THEN
      v_title := 'Meeting Reminder: ' || v_meeting.title;
      v_message := 'Your meeting is coming up on ' ||
                   to_char(v_meeting.scheduled_at, 'FMDay, FMMonth DD, YYYY at HH12:MI AM');
    ELSE
      RAISE EXCEPTION 'Invalid notification type: %', p_notification_type;
  END CASE;

  -- Create notifications for all active club members
  INSERT INTO club_event_notifications (
    club_id,
    user_id,
    meeting_id,
    notification_type,
    title,
    message
  )
  SELECT
    p_club_id,
    cm.user_id,
    p_meeting_id,
    p_notification_type,
    v_title,
    v_message
  FROM club_members cm
  WHERE cm.club_id = p_club_id
    AND cm.role != 'pending';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get meeting analytics for dashboard integration
-- Drop existing function first to ensure clean recreation
DROP FUNCTION IF EXISTS get_club_meeting_analytics(UUID);

CREATE OR REPLACE FUNCTION get_club_meeting_analytics(p_club_id UUID)
RETURNS TABLE (
  total_meetings INTEGER,
  upcoming_meetings INTEGER,
  meetings_this_month INTEGER,
  avg_duration_minutes DECIMAL,
  most_common_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    -- Total meetings
    (SELECT COUNT(*)::INTEGER FROM club_meetings WHERE club_id = p_club_id),

    -- Upcoming meetings
    (SELECT COUNT(*)::INTEGER FROM club_meetings
     WHERE club_id = p_club_id AND scheduled_at > NOW()),

    -- Meetings this month
    (SELECT COUNT(*)::INTEGER FROM club_meetings
     WHERE club_id = p_club_id
       AND scheduled_at >= date_trunc('month', NOW())
       AND scheduled_at < date_trunc('month', NOW()) + INTERVAL '1 month'),

    -- Average duration
    (SELECT COALESCE(AVG(duration_minutes), 0)::DECIMAL FROM club_meetings
     WHERE club_id = p_club_id),

    -- Most common meeting type
    (SELECT meeting_type FROM club_meetings
     WHERE club_id = p_club_id
     GROUP BY meeting_type
     ORDER BY COUNT(*) DESC
     LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. Triggers for Automatic Updates
-- =====================================================

-- Ensure the update_updated_at_column function exists (from Phase 1 migration)
-- Create it if it doesn't exist to make this migration self-contained
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for club_meetings updated_at
DROP TRIGGER IF EXISTS update_club_meetings_updated_at ON club_meetings;
CREATE TRIGGER update_club_meetings_updated_at
  BEFORE UPDATE ON club_meetings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to automatically create notifications when meetings are created
-- Drop existing function first to ensure clean recreation
DROP FUNCTION IF EXISTS trigger_create_meeting_notifications() CASCADE;

CREATE OR REPLACE FUNCTION trigger_create_meeting_notifications()
RETURNS TRIGGER AS $$
BEGIN
  -- Create notifications for new meetings
  IF TG_OP = 'INSERT' THEN
    PERFORM create_meeting_notifications(NEW.id, NEW.club_id, 'meeting_created');
  -- Create notifications for updated meetings
  ELSIF TG_OP = 'UPDATE' AND (
    OLD.title != NEW.title OR
    OLD.scheduled_at != NEW.scheduled_at OR
    OLD.virtual_link != NEW.virtual_link OR
    OLD.description != NEW.description
  ) THEN
    PERFORM create_meeting_notifications(NEW.id, NEW.club_id, 'meeting_updated');
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic notifications
DROP TRIGGER IF EXISTS club_meetings_notification_trigger ON club_meetings;
CREATE TRIGGER club_meetings_notification_trigger
  AFTER INSERT OR UPDATE ON club_meetings
  FOR EACH ROW EXECUTE FUNCTION trigger_create_meeting_notifications();

-- =====================================================
-- 7. Update Analytics Function to Include Meeting Data
-- =====================================================

-- Drop the existing function first to allow return type changes
DROP FUNCTION IF EXISTS get_club_analytics_summary(UUID);

-- Create the updated analytics function to include meeting metrics
CREATE OR REPLACE FUNCTION get_club_analytics_summary(p_club_id UUID)
RETURNS TABLE (
  member_count INTEGER,
  active_members_week INTEGER,
  discussion_count INTEGER,
  posts_count INTEGER,
  reading_completion_rate DECIMAL,
  total_meetings INTEGER,
  upcoming_meetings INTEGER,
  meetings_this_month INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    -- Total active members (excluding pending)
    (SELECT COUNT(*)::INTEGER FROM club_members
     WHERE club_id = p_club_id AND role != 'pending'),

    -- Active members this week (posted in discussions)
    (SELECT COUNT(DISTINCT cm.user_id)::INTEGER
     FROM club_members cm
     JOIN discussion_posts dp ON dp.user_id = cm.user_id
     JOIN discussion_topics dt ON dp.topic_id = dt.id
     WHERE cm.club_id = p_club_id
       AND cm.role != 'pending'
       AND dt.club_id = p_club_id
       AND dp.created_at > NOW() - INTERVAL '7 days'),

    -- Total discussion topics
    (SELECT COUNT(*)::INTEGER FROM discussion_topics
     WHERE club_id = p_club_id),

    -- Total discussion posts
    (SELECT COUNT(*)::INTEGER FROM discussion_posts dp
     JOIN discussion_topics dt ON dp.topic_id = dt.id
     WHERE dt.club_id = p_club_id),

    -- Reading completion rate (placeholder for Phase 4)
    0.00::DECIMAL,

    -- Total meetings
    (SELECT COUNT(*)::INTEGER FROM club_meetings WHERE club_id = p_club_id),

    -- Upcoming meetings
    (SELECT COUNT(*)::INTEGER FROM club_meetings
     WHERE club_id = p_club_id AND scheduled_at > NOW()),

    -- Meetings this month
    (SELECT COUNT(*)::INTEGER FROM club_meetings
     WHERE club_id = p_club_id
       AND scheduled_at >= date_trunc('month', NOW())
       AND scheduled_at < date_trunc('month', NOW()) + INTERVAL '1 month');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Migration Complete
-- =====================================================

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'Club Management Phase 3 Events Migration Completed Successfully';
  RAISE NOTICE 'Tables created: club_meetings, club_event_notifications';
  RAISE NOTICE 'Functions created: get_club_meetings, create_meeting_notifications, get_club_meeting_analytics';
  RAISE NOTICE 'Updated function: get_club_analytics_summary (now includes meeting metrics)';
  RAISE NOTICE 'RLS policies, indexes, and triggers applied';
  RAISE NOTICE 'Migration script: 002_club_events_foundation_fixed.sql';
END $$;