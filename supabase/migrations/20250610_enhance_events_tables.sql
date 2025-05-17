-- Events Feature Enhancement Migration
-- Generated on 2025-06-10

-- Enable pgcrypto for UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================
-- Enhance events table
-- =========================

-- First, check if the events table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'events') THEN
        -- Create the events table if it doesn't exist
        CREATE TABLE events (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            title TEXT NOT NULL,
            date TEXT NOT NULL,
            description TEXT NOT NULL,
            created_at TIMESTAMPTZ DEFAULT now()
        );
    END IF;
END $$;

-- Now, enhance the events table with additional columns
ALTER TABLE events
ADD COLUMN IF NOT EXISTS club_id UUID REFERENCES book_clubs(id),
ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id),
ADD COLUMN IF NOT EXISTS event_type TEXT CHECK (event_type IN ('discussion', 'author_meet', 'book_signing', 'festival', 'reading_marathon', 'book_swap')),
ADD COLUMN IF NOT EXISTS start_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS end_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS is_virtual BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS virtual_meeting_link TEXT,
ADD COLUMN IF NOT EXISTS max_participants INTEGER,
ADD COLUMN IF NOT EXISTS featured_on_landing BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- =========================
-- Create event_participants table
-- =========================
CREATE TABLE IF NOT EXISTS event_participants (
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    rsvp_status TEXT CHECK (rsvp_status IN ('going', 'maybe', 'not_going')),
    rsvp_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (event_id, user_id)
);

-- =========================
-- Create event_notifications table
-- =========================
CREATE TABLE IF NOT EXISTS event_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (event_id, user_id)
);

-- =========================
-- Add trigger to update updated_at timestamp
-- =========================
CREATE OR REPLACE FUNCTION update_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER events_updated_at_trigger
BEFORE UPDATE ON events
FOR EACH ROW
EXECUTE FUNCTION update_events_updated_at();

-- =========================
-- Enable RLS on new tables
-- =========================
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_notifications ENABLE ROW LEVEL SECURITY;

-- =========================
-- Events RLS policies
-- =========================

-- Anyone can view events
CREATE POLICY "Anyone can view events"
ON events
FOR SELECT
USING (true);

-- Only store owners/managers can create events
CREATE POLICY "Only store owners/managers can create events"
ON events
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM store_administrators
    WHERE store_id = NEW.store_id
    AND user_id = auth.uid()
    AND role IN ('owner', 'manager')
  )
);

-- Only event creator or store owner/manager can update events
CREATE POLICY "Only event creator or store owner/manager can update events"
ON events
FOR UPDATE
USING (
  created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM store_administrators
    WHERE store_id = events.store_id
    AND user_id = auth.uid()
    AND role IN ('owner', 'manager')
  )
);

-- Only event creator or store owner/manager can delete events
CREATE POLICY "Only event creator or store owner/manager can delete events"
ON events
FOR DELETE
USING (
  created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM store_administrators
    WHERE store_id = events.store_id
    AND user_id = auth.uid()
    AND role IN ('owner', 'manager')
  )
);

-- =========================
-- Event participants RLS policies
-- =========================

-- Anyone can view event participants
CREATE POLICY "Anyone can view event participants"
ON event_participants
FOR SELECT
USING (true);

-- Users can only RSVP for themselves
CREATE POLICY "Users can only RSVP for themselves"
ON event_participants
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Users can only update their own RSVPs
CREATE POLICY "Users can only update their own RSVPs"
ON event_participants
FOR UPDATE
USING (user_id = auth.uid());

-- Users can only delete their own RSVPs
CREATE POLICY "Users can only delete their own RSVPs"
ON event_participants
FOR DELETE
USING (user_id = auth.uid());

-- =========================
-- Event notifications RLS policies
-- =========================

-- Users can only view their own notifications
CREATE POLICY "Users can only view their own notifications"
ON event_notifications
FOR SELECT
USING (user_id = auth.uid());

-- System can insert notifications for any user
CREATE POLICY "System can insert notifications for any user"
ON event_notifications
FOR INSERT
WITH CHECK (true);

-- Users can only update their own notifications
CREATE POLICY "Users can only update their own notifications"
ON event_notifications
FOR UPDATE
USING (user_id = auth.uid());

-- Users can only delete their own notifications
CREATE POLICY "Users can only delete their own notifications"
ON event_notifications
FOR DELETE
USING (user_id = auth.uid());
