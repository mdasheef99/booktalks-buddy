-- Reading Progress Tracking System Migration
-- Generated on 2025-01-24
-- Purpose: Add lightweight progress tracking for book club members

-- Enable pgcrypto for UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================
-- Table: member_reading_progress
-- =========================
CREATE TABLE IF NOT EXISTS member_reading_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES book_clubs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    book_id UUID REFERENCES books(id) ON DELETE SET NULL,
    
    -- Progress tracking fields
    status TEXT NOT NULL CHECK (status IN ('not_started', 'reading', 'finished')) DEFAULT 'not_started',
    progress_type TEXT CHECK (progress_type IN ('percentage', 'chapter', 'page')),
    current_progress INTEGER CHECK (current_progress >= 0),
    total_progress INTEGER CHECK (total_progress > 0),
    progress_percentage INTEGER CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    notes TEXT CHECK (char_length(notes) <= 500),
    
    -- Privacy and metadata
    is_private BOOLEAN NOT NULL DEFAULT false,
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    last_updated TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Constraints
    UNIQUE(club_id, user_id, book_id),
    
    -- Validation constraints
    CONSTRAINT valid_progress_data CHECK (
        (progress_type = 'percentage' AND progress_percentage IS NOT NULL AND current_progress IS NULL AND total_progress IS NULL) OR
        (progress_type IN ('chapter', 'page') AND current_progress IS NOT NULL AND total_progress IS NOT NULL AND progress_percentage IS NULL) OR
        (status = 'not_started' AND progress_type IS NULL)
    ),
    CONSTRAINT valid_started_at CHECK (
        (status IN ('reading', 'finished') AND started_at IS NOT NULL) OR
        (status = 'not_started' AND started_at IS NULL)
    ),
    CONSTRAINT valid_finished_at CHECK (
        (status = 'finished' AND finished_at IS NOT NULL) OR
        (status != 'finished' AND finished_at IS NULL)
    )
);

-- =========================
-- Add feature toggle to book_clubs table
-- =========================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'book_clubs' AND column_name = 'progress_tracking_enabled'
    ) THEN
        ALTER TABLE book_clubs 
        ADD COLUMN progress_tracking_enabled BOOLEAN DEFAULT false;
    END IF;
END $$;

-- =========================
-- Indexes for Performance
-- =========================
-- Composite indexes for frequent queries
CREATE INDEX IF NOT EXISTS idx_member_reading_progress_club_user ON member_reading_progress(club_id, user_id);
CREATE INDEX IF NOT EXISTS idx_member_reading_progress_club_book ON member_reading_progress(club_id, book_id);

-- Single column indexes
CREATE INDEX IF NOT EXISTS idx_member_reading_progress_user ON member_reading_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_member_reading_progress_status ON member_reading_progress(club_id, status);
CREATE INDEX IF NOT EXISTS idx_member_reading_progress_updated ON member_reading_progress(last_updated DESC);

-- Feature toggle index
CREATE INDEX IF NOT EXISTS idx_book_clubs_progress_enabled ON book_clubs(progress_tracking_enabled) WHERE progress_tracking_enabled = true;

-- =========================
-- Enable RLS
-- =========================
ALTER TABLE member_reading_progress ENABLE ROW LEVEL SECURITY;

-- =========================
-- RLS Policies
-- =========================

-- Policy 1: Users can view their own progress
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_policies
        WHERE tablename = 'member_reading_progress' AND policyname = 'Users can view own reading progress'
    ) THEN
        CREATE POLICY "Users can view own reading progress" ON member_reading_progress
          FOR SELECT USING (
            user_id = auth.uid()
          );
    END IF;
END $$;

-- Policy 2: Users can view public progress of club members
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_policies
        WHERE tablename = 'member_reading_progress' AND policyname = 'Users can view public progress in their clubs'
    ) THEN
        CREATE POLICY "Users can view public progress in their clubs" ON member_reading_progress
          FOR SELECT USING (
            is_private = false
            AND EXISTS (
              SELECT 1 FROM club_members cm
              WHERE cm.club_id = member_reading_progress.club_id
              AND cm.user_id = auth.uid()
            )
          );
    END IF;
END $$;

-- Policy 3: Users can insert their own progress
CREATE POLICY "Users can insert own reading progress" ON member_reading_progress
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM club_members cm
      WHERE cm.club_id = member_reading_progress.club_id
      AND cm.user_id = auth.uid()
    )
  );

-- Policy 4: Users can update their own progress
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_policies
        WHERE tablename = 'member_reading_progress' AND policyname = 'Users can update own reading progress'
    ) THEN
        CREATE POLICY "Users can update own reading progress" ON member_reading_progress
          FOR UPDATE USING (
            user_id = auth.uid()
          ) WITH CHECK (
            user_id = auth.uid()
          );
    END IF;
END $$;

-- Policy 5: Users can delete their own progress
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_policies
        WHERE tablename = 'member_reading_progress' AND policyname = 'Users can delete own reading progress'
    ) THEN
        CREATE POLICY "Users can delete own reading progress" ON member_reading_progress
          FOR DELETE USING (
            user_id = auth.uid()
          );
    END IF;
END $$;

-- =========================
-- Helper Functions
-- =========================

-- Function to get club reading completion statistics
CREATE OR REPLACE FUNCTION get_club_reading_stats(p_club_id UUID)
RETURNS TABLE (
  total_members INTEGER,
  not_started_count INTEGER,
  reading_count INTEGER,
  finished_count INTEGER,
  completion_percentage DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*)::INTEGER FROM club_members WHERE club_id = p_club_id) as total_members,
    COUNT(CASE WHEN mrp.status = 'not_started' THEN 1 END)::INTEGER as not_started_count,
    COUNT(CASE WHEN mrp.status = 'reading' THEN 1 END)::INTEGER as reading_count,
    COUNT(CASE WHEN mrp.status = 'finished' THEN 1 END)::INTEGER as finished_count,
    CASE
      WHEN COUNT(*) > 0 THEN
        ROUND((COUNT(CASE WHEN mrp.status = 'finished' THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL) * 100, 2)
      ELSE 0.0
    END as completion_percentage
  FROM member_reading_progress mrp
  WHERE mrp.club_id = p_club_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update progress timestamps automatically
CREATE OR REPLACE FUNCTION update_reading_progress_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  -- Update last_updated timestamp
  NEW.last_updated = now();

  -- Set started_at when status changes to 'reading' or 'finished'
  IF OLD.status = 'not_started' AND NEW.status IN ('reading', 'finished') THEN
    NEW.started_at = now();
  END IF;

  -- Set finished_at when status changes to 'finished'
  IF OLD.status != 'finished' AND NEW.status = 'finished' THEN
    NEW.finished_at = now();
  END IF;

  -- Clear finished_at if status changes from 'finished'
  IF OLD.status = 'finished' AND NEW.status != 'finished' THEN
    NEW.finished_at = NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
DROP TRIGGER IF EXISTS trigger_update_reading_progress_timestamps ON member_reading_progress;
CREATE TRIGGER trigger_update_reading_progress_timestamps
  BEFORE UPDATE ON member_reading_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_reading_progress_timestamps();

-- =========================
-- Comments for Documentation
-- =========================
COMMENT ON TABLE member_reading_progress IS 'Tracks reading progress for book club members with privacy controls';
COMMENT ON COLUMN member_reading_progress.status IS 'Reading status: not_started, reading, finished';
COMMENT ON COLUMN member_reading_progress.progress_type IS 'Type of progress tracking: percentage, chapter, or page';
COMMENT ON COLUMN member_reading_progress.current_progress IS 'Current chapter/page number (used with progress_type)';
COMMENT ON COLUMN member_reading_progress.total_progress IS 'Total chapters/pages (used with progress_type)';
COMMENT ON COLUMN member_reading_progress.progress_percentage IS 'Completion percentage (0-100), only for percentage type';
COMMENT ON COLUMN member_reading_progress.notes IS 'Personal reading notes, max 500 characters';
COMMENT ON COLUMN member_reading_progress.is_private IS 'Privacy flag - if true, only visible to the user who set it';
COMMENT ON COLUMN book_clubs.progress_tracking_enabled IS 'Feature toggle - enables progress tracking for this club';
