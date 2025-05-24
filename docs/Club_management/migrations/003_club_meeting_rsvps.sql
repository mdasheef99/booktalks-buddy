-- Club Meeting RSVP System Migration
-- Creates RSVP functionality for club-specific events only
-- Maintains complete separation from general platform events system

-- =========================
-- Create club_meeting_rsvps table
-- =========================

CREATE TABLE IF NOT EXISTS club_meeting_rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES club_meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  club_id UUID NOT NULL REFERENCES book_clubs(id) ON DELETE CASCADE,
  rsvp_status TEXT NOT NULL CHECK (rsvp_status IN ('going', 'maybe', 'not_going')),
  rsvp_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Ensure one RSVP per user per meeting
  UNIQUE(meeting_id, user_id)
);

-- =========================
-- Create indexes for performance
-- =========================

CREATE INDEX IF NOT EXISTS idx_club_meeting_rsvps_meeting_id ON club_meeting_rsvps(meeting_id);
CREATE INDEX IF NOT EXISTS idx_club_meeting_rsvps_user_id ON club_meeting_rsvps(user_id);
CREATE INDEX IF NOT EXISTS idx_club_meeting_rsvps_club_id ON club_meeting_rsvps(club_id);
CREATE INDEX IF NOT EXISTS idx_club_meeting_rsvps_status ON club_meeting_rsvps(rsvp_status);

-- =========================
-- Create updated_at trigger
-- =========================

CREATE OR REPLACE FUNCTION update_club_meeting_rsvps_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_club_meeting_rsvps_updated_at
  BEFORE UPDATE ON club_meeting_rsvps
  FOR EACH ROW
  EXECUTE FUNCTION update_club_meeting_rsvps_updated_at();

-- =========================
-- Row Level Security (RLS) Policies
-- =========================

-- Enable RLS
ALTER TABLE club_meeting_rsvps ENABLE ROW LEVEL SECURITY;

-- Policy: Club members can view RSVPs for their club's meetings
CREATE POLICY "Club members can view meeting RSVPs" ON club_meeting_rsvps
  FOR SELECT USING (
    club_id IN (
      SELECT club_id FROM club_members
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Club members can create RSVPs for their club's meetings
CREATE POLICY "Club members can create meeting RSVPs" ON club_meeting_rsvps
  FOR INSERT WITH CHECK (
    -- User must be a member of the club
    club_id IN (
      SELECT club_id FROM club_members
      WHERE user_id = auth.uid()
    )
    AND
    -- Can only RSVP for themselves
    user_id = auth.uid()
    AND
    -- Meeting must belong to the same club
    meeting_id IN (
      SELECT id FROM club_meetings
      WHERE club_id = club_meeting_rsvps.club_id
    )
  );

-- Policy: Users can update their own RSVPs
CREATE POLICY "Users can update their own meeting RSVPs" ON club_meeting_rsvps
  FOR UPDATE USING (
    user_id = auth.uid()
    AND
    club_id IN (
      SELECT club_id FROM club_members
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can delete their own RSVPs
CREATE POLICY "Users can delete their own meeting RSVPs" ON club_meeting_rsvps
  FOR DELETE USING (
    user_id = auth.uid()
    AND
    club_id IN (
      SELECT club_id FROM club_members
      WHERE user_id = auth.uid()
    )
  );

-- =========================
-- Database Functions for RSVP Analytics
-- =========================

-- Function to get RSVP statistics for a meeting
CREATE OR REPLACE FUNCTION get_meeting_rsvp_stats(p_meeting_id UUID)
RETURNS TABLE (
  total_rsvps BIGINT,
  going_count BIGINT,
  maybe_count BIGINT,
  not_going_count BIGINT,
  response_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH rsvp_counts AS (
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE rsvp_status = 'going') as going,
      COUNT(*) FILTER (WHERE rsvp_status = 'maybe') as maybe,
      COUNT(*) FILTER (WHERE rsvp_status = 'not_going') as not_going
    FROM club_meeting_rsvps
    WHERE meeting_id = p_meeting_id
  ),
  club_member_count AS (
    SELECT COUNT(*) as total_members
    FROM club_members cm
    JOIN club_meetings m ON m.club_id = cm.club_id
    WHERE m.id = p_meeting_id
  )
  SELECT
    rc.total,
    rc.going,
    rc.maybe,
    rc.not_going,
    CASE
      WHEN cmc.total_members > 0 THEN
        ROUND((rc.total::NUMERIC / cmc.total_members::NUMERIC) * 100, 2)
      ELSE 0
    END as response_rate
  FROM rsvp_counts rc, club_member_count cmc;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all RSVP statistics for a club's meetings
CREATE OR REPLACE FUNCTION get_club_meeting_rsvp_stats(p_club_id UUID)
RETURNS TABLE (
  meeting_id UUID,
  meeting_title TEXT,
  scheduled_at TIMESTAMPTZ,
  total_rsvps BIGINT,
  going_count BIGINT,
  maybe_count BIGINT,
  not_going_count BIGINT,
  response_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.title,
    m.scheduled_at,
    COALESCE(stats.total_rsvps, 0),
    COALESCE(stats.going_count, 0),
    COALESCE(stats.maybe_count, 0),
    COALESCE(stats.not_going_count, 0),
    COALESCE(stats.response_rate, 0)
  FROM club_meetings m
  LEFT JOIN LATERAL get_meeting_rsvp_stats(m.id) stats ON true
  WHERE m.club_id = p_club_id
  ORDER BY m.scheduled_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================
-- Grant permissions
-- =========================

-- Grant execute permissions on functions to authenticated users
GRANT EXECUTE ON FUNCTION get_meeting_rsvp_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_club_meeting_rsvp_stats(UUID) TO authenticated;

-- =========================
-- Verification queries
-- =========================

-- Check that table was created successfully
SELECT schemaname, tablename, tableowner
FROM pg_tables
WHERE tablename = 'club_meeting_rsvps';

-- Check that RLS policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'club_meeting_rsvps'
ORDER BY policyname;

-- =========================
-- Migration completion log
-- =========================
DO $$
BEGIN
  RAISE NOTICE 'Club Meeting RSVP System Migration Completed Successfully';
  RAISE NOTICE 'Created table: club_meeting_rsvps';
  RAISE NOTICE 'Created RLS policies for club member access control';
  RAISE NOTICE 'Created analytics functions: get_meeting_rsvp_stats, get_club_meeting_rsvp_stats';
  RAISE NOTICE 'RSVP system maintains complete separation from general events system';
  RAISE NOTICE 'Migration script: 003_club_meeting_rsvps.sql';
END $$;
