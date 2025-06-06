-- =====================================================
-- Club Management Phase 1 - Foundation Database Setup
-- Migration: 001_club_analytics_foundation.sql
-- Purpose: Create analytics tables and enhanced moderator permissions
-- Phase: 1 - Foundation & Page Migration (Week 2)
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. Club Analytics Snapshots Table
-- =====================================================

-- Create club_analytics_snapshots table for daily analytics data
CREATE TABLE IF NOT EXISTS club_analytics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES book_clubs(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,

  -- Member metrics
  member_count INTEGER DEFAULT 0,
  active_members_week INTEGER DEFAULT 0,
  new_members_month INTEGER DEFAULT 0,

  -- Discussion metrics
  discussion_count INTEGER DEFAULT 0,
  posts_count INTEGER DEFAULT 0,
  posts_this_week INTEGER DEFAULT 0,

  -- Reading metrics
  reading_completion_rate DECIMAL(5,2) DEFAULT 0.00,
  current_book_progress DECIMAL(5,2) DEFAULT 0.00,

  -- Meeting metrics (for Phase 3)
  meeting_attendance_rate DECIMAL(5,2) DEFAULT 0.00,
  meetings_this_month INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Ensure one snapshot per club per date
  UNIQUE(club_id, snapshot_date)
);

-- =====================================================
-- 2. Enhanced Moderator Permissions
-- =====================================================

-- Check if club_moderators table exists, if not create it
CREATE TABLE IF NOT EXISTS club_moderators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES book_clubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  appointed_by UUID REFERENCES auth.users(id),
  appointed_at TIMESTAMPTZ DEFAULT now(),

  -- Basic moderator info
  role TEXT DEFAULT 'moderator' CHECK (role IN ('moderator', 'lead')),
  is_active BOOLEAN DEFAULT true,

  -- Enhanced permissions for Phase 2 & 3
  analytics_access BOOLEAN DEFAULT false,
  meeting_management_access BOOLEAN DEFAULT true,
  customization_access BOOLEAN DEFAULT false,
  content_moderation_access BOOLEAN DEFAULT true,
  member_management_access BOOLEAN DEFAULT false,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Ensure one moderator record per user per club
  UNIQUE(club_id, user_id)
);

-- If the table already exists, add the new columns safely
DO $$
BEGIN
  -- Add is_active column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'club_moderators' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE club_moderators ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;

  -- Add analytics_access column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'club_moderators' AND column_name = 'analytics_access'
  ) THEN
    ALTER TABLE club_moderators ADD COLUMN analytics_access BOOLEAN DEFAULT false;
  END IF;

  -- Add meeting_management_access column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'club_moderators' AND column_name = 'meeting_management_access'
  ) THEN
    ALTER TABLE club_moderators ADD COLUMN meeting_management_access BOOLEAN DEFAULT true;
  END IF;

  -- Add customization_access column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'club_moderators' AND column_name = 'customization_access'
  ) THEN
    ALTER TABLE club_moderators ADD COLUMN customization_access BOOLEAN DEFAULT false;
  END IF;

  -- Add content_moderation_access column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'club_moderators' AND column_name = 'content_moderation_access'
  ) THEN
    ALTER TABLE club_moderators ADD COLUMN content_moderation_access BOOLEAN DEFAULT true;
  END IF;

  -- Add member_management_access column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'club_moderators' AND column_name = 'member_management_access'
  ) THEN
    ALTER TABLE club_moderators ADD COLUMN member_management_access BOOLEAN DEFAULT false;
  END IF;

  -- Add role column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'club_moderators' AND column_name = 'role'
  ) THEN
    ALTER TABLE club_moderators ADD COLUMN role TEXT DEFAULT 'moderator' CHECK (role IN ('moderator', 'lead'));
  END IF;

  -- Add appointed_by column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'club_moderators' AND column_name = 'appointed_by'
  ) THEN
    ALTER TABLE club_moderators ADD COLUMN appointed_by UUID REFERENCES auth.users(id);
  END IF;

  -- Add appointed_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'club_moderators' AND column_name = 'appointed_at'
  ) THEN
    ALTER TABLE club_moderators ADD COLUMN appointed_at TIMESTAMPTZ DEFAULT now();
  END IF;
END $$;

-- =====================================================
-- 3. Performance Indexes
-- =====================================================

-- Indexes for club_analytics_snapshots
CREATE INDEX IF NOT EXISTS idx_club_analytics_club_date
  ON club_analytics_snapshots(club_id, snapshot_date DESC);

CREATE INDEX IF NOT EXISTS idx_club_analytics_date
  ON club_analytics_snapshots(snapshot_date DESC);

CREATE INDEX IF NOT EXISTS idx_club_analytics_club_created
  ON club_analytics_snapshots(club_id, created_at DESC);

-- Indexes for club_moderators
CREATE INDEX IF NOT EXISTS idx_club_moderators_club_id
  ON club_moderators(club_id) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_club_moderators_user_id
  ON club_moderators(user_id) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_club_moderators_analytics
  ON club_moderators(club_id, analytics_access) WHERE is_active = true;

-- =====================================================
-- 4. Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS on club_analytics_snapshots
ALTER TABLE club_analytics_snapshots ENABLE ROW LEVEL SECURITY;

-- Policy: Club members can view analytics snapshots for their clubs
CREATE POLICY "Club members can view analytics snapshots" ON club_analytics_snapshots
  FOR SELECT USING (
    club_id IN (
      SELECT club_id FROM club_members
      WHERE user_id = auth.uid() AND role != 'pending'
    )
  );

-- Policy: Club leads can manage analytics snapshots
CREATE POLICY "Club leads can manage analytics snapshots" ON club_analytics_snapshots
  FOR ALL USING (
    club_id IN (
      SELECT club_id FROM club_members
      WHERE user_id = auth.uid() AND role = 'lead'
    )
  );

-- Enable RLS on club_moderators (if not already enabled)
ALTER TABLE club_moderators ENABLE ROW LEVEL SECURITY;

-- Policy: Club members can view moderators for their clubs
CREATE POLICY "Club members can view moderators" ON club_moderators
  FOR SELECT USING (
    club_id IN (
      SELECT club_id FROM club_members
      WHERE user_id = auth.uid() AND role != 'pending'
    )
  );

-- Policy: Club leads can manage moderators
CREATE POLICY "Club leads can manage moderators" ON club_moderators
  FOR ALL USING (
    club_id IN (
      SELECT club_id FROM club_members
      WHERE user_id = auth.uid() AND role = 'lead'
    )
  );

-- =====================================================
-- 5. Database Functions for Analytics
-- =====================================================

-- Function to get basic club analytics summary
CREATE OR REPLACE FUNCTION get_club_analytics_summary(p_club_id UUID)
RETURNS TABLE (
  member_count INTEGER,
  active_members_week INTEGER,
  discussion_count INTEGER,
  posts_count INTEGER,
  reading_completion_rate DECIMAL
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
    0.00::DECIMAL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create daily analytics snapshot
CREATE OR REPLACE FUNCTION create_daily_analytics_snapshot(p_club_id UUID)
RETURNS VOID AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_analytics RECORD;
BEGIN
  -- Get current analytics
  SELECT * INTO v_analytics FROM get_club_analytics_summary(p_club_id);

  -- Insert or update today's snapshot
  INSERT INTO club_analytics_snapshots (
    club_id,
    snapshot_date,
    member_count,
    active_members_week,
    discussion_count,
    posts_count,
    reading_completion_rate
  ) VALUES (
    p_club_id,
    v_today,
    v_analytics.member_count,
    v_analytics.active_members_week,
    v_analytics.discussion_count,
    v_analytics.posts_count,
    v_analytics.reading_completion_rate
  )
  ON CONFLICT (club_id, snapshot_date)
  DO UPDATE SET
    member_count = EXCLUDED.member_count,
    active_members_week = EXCLUDED.active_members_week,
    discussion_count = EXCLUDED.discussion_count,
    posts_count = EXCLUDED.posts_count,
    reading_completion_rate = EXCLUDED.reading_completion_rate,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. Triggers for Automatic Updates
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for club_analytics_snapshots
DROP TRIGGER IF EXISTS update_club_analytics_snapshots_updated_at ON club_analytics_snapshots;
CREATE TRIGGER update_club_analytics_snapshots_updated_at
  BEFORE UPDATE ON club_analytics_snapshots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for club_moderators
DROP TRIGGER IF EXISTS update_club_moderators_updated_at ON club_moderators;
CREATE TRIGGER update_club_moderators_updated_at
  BEFORE UPDATE ON club_moderators
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Migration Complete
-- =====================================================

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'Club Management Phase 1 Foundation Migration Completed Successfully';
  RAISE NOTICE 'Tables created: club_analytics_snapshots, enhanced club_moderators';
  RAISE NOTICE 'Functions created: get_club_analytics_summary, create_daily_analytics_snapshot';
  RAISE NOTICE 'RLS policies and indexes applied';
END $$;
