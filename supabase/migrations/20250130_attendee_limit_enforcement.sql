-- =========================
-- Attendee Limit Enforcement Migration
-- Purpose: Add database triggers to enforce max_attendees limits for both club meetings and store events
-- Date: 2025-01-30
-- =========================

-- Function to check attendee limits before RSVP for club meetings
CREATE OR REPLACE FUNCTION check_attendee_limit_before_rsvp()
RETURNS TRIGGER AS $$
DECLARE
    meeting_max_attendees INTEGER;
    current_going_count INTEGER;
    old_status TEXT;
BEGIN
    -- Only c please heck for 'going' status
    IF NEW.rsvp_status != 'going' THEN
        RETURN NEW;
    END IF;

    -- Get the meeting's max_attendees limit
    SELECT max_attendees INTO meeting_max_attendees
    FROM club_meetings
    WHERE id = NEW.meeting_id;

    -- If no limit set, allow the RSVP
    IF meeting_max_attendees IS NULL THEN
        RETURN NEW;
    END IF;

    -- Get current count of 'going' RSVPs
    SELECT COUNT(*) INTO current_going_count
    FROM club_meeting_rsvps
    WHERE meeting_id = NEW.meeting_id
    AND rsvp_status = 'going'
    AND user_id != NEW.user_id; -- Exclude current user for updates

    -- For updates, check if user was previously 'going'
    IF TG_OP = 'UPDATE' THEN
        SELECT rsvp_status INTO old_status
        FROM club_meeting_rsvps
        WHERE meeting_id = NEW.meeting_id
        AND user_id = NEW.user_id;
        
        -- If user was already 'going', don't count them in the limit
        IF old_status = 'going' THEN
            RETURN NEW;
        END IF;
    END IF;

    -- Check if adding this RSVP would exceed the limit
    IF current_going_count >= meeting_max_attendees THEN
        RAISE EXCEPTION 'Meeting is full. Maximum attendees: %, Current attendees: %', 
            meeting_max_attendees, current_going_count
            USING ERRCODE = 'P0001';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to check attendee limits for store events
CREATE OR REPLACE FUNCTION check_store_event_attendee_limit()
RETURNS TRIGGER AS $$
DECLARE
    event_max_participants INTEGER;
    current_going_count INTEGER;
    old_status TEXT;
BEGIN
    -- Only check for 'going' status
    IF NEW.rsvp_status != 'going' THEN
        RETURN NEW;
    END IF;

    -- Get the event's max_participants limit
    SELECT max_participants INTO event_max_participants
    FROM events
    WHERE id = NEW.event_id;

    -- If no limit set, allow the RSVP
    IF event_max_participants IS NULL THEN
        RETURN NEW;
    END IF;

    -- Get current count of 'going' RSVPs
    SELECT COUNT(*) INTO current_going_count
    FROM event_participants
    WHERE event_id = NEW.event_id
    AND rsvp_status = 'going'
    AND user_id != NEW.user_id; -- Exclude current user for updates

    -- For updates, check if user was previously 'going'
    IF TG_OP = 'UPDATE' THEN
        SELECT rsvp_status INTO old_status
        FROM event_participants
        WHERE event_id = NEW.event_id
        AND user_id = NEW.user_id;
        
        -- If user was already 'going', don't count them in the limit
        IF old_status = 'going' THEN
            RETURN NEW;
        END IF;
    END IF;

    -- Check if adding this RSVP would exceed the limit
    IF current_going_count >= event_max_participants THEN
        RAISE EXCEPTION 'Event is full. Maximum participants: %, Current participants: %', 
            event_max_participants, current_going_count
            USING ERRCODE = 'P0001';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for club meeting RSVPs
DROP TRIGGER IF EXISTS enforce_attendee_limit_trigger ON club_meeting_rsvps;
CREATE TRIGGER enforce_attendee_limit_trigger
    BEFORE INSERT OR UPDATE ON club_meeting_rsvps
    FOR EACH ROW
    EXECUTE FUNCTION check_attendee_limit_before_rsvp();

-- Create trigger for store event participants
DROP TRIGGER IF EXISTS enforce_store_event_attendee_limit_trigger ON event_participants;
CREATE TRIGGER enforce_store_event_attendee_limit_trigger
    BEFORE INSERT OR UPDATE ON event_participants
    FOR EACH ROW
    EXECUTE FUNCTION check_store_event_attendee_limit();

-- Log migration completion
DO $$
BEGIN
    RAISE NOTICE '=== ATTENDEE LIMIT ENFORCEMENT MIGRATION COMPLETED ===';
    RAISE NOTICE 'Functions created: check_attendee_limit_before_rsvp, check_store_event_attendee_limit';
    RAISE NOTICE 'Triggers created: enforce_attendee_limit_trigger, enforce_store_event_attendee_limit_trigger';
    RAISE NOTICE 'Both club meetings and store events now enforce max attendee limits';
    RAISE NOTICE 'Migration file: 20250130_attendee_limit_enforcement.sql';
END $$;
