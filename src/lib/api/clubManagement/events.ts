/**
 * Club Events/Meetings Management API
 *
 * Phase 3 implementation for club-specific events and meetings.
 */

import { supabase } from '@/lib/supabase';
import {
  ClubMeeting,
  CreateMeetingRequest,
  UpdateMeetingRequest,
  MeetingQueryOptions,
  ClubEventNotification,
  MeetingAnalytics,
  ClubManagementAPIError,
  ClubMeetingRSVP,
  CreateRSVPRequest,
  UpdateRSVPRequest,
  MeetingRSVPStats,
  RSVPStatus
} from './types';
import { handleAPIError } from './utils';

// =====================================================
// Meeting Management Functions
// =====================================================

/**
 * Create a new club meeting
 */
export async function createClubMeeting(
  clubId: string,
  meetingData: CreateMeetingRequest,
  userId: string
): Promise<ClubMeeting> {
  try {
    const { data, error } = await supabase
      .from('club_meetings')
      .insert([{
        club_id: clubId,
        created_by: userId,
        ...meetingData
      }])
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    handleAPIError(error, 'create club meeting');
  }
}

/**
 * Get club meetings with optional filtering
 */
export async function getClubMeetings(
  clubId: string,
  options: MeetingQueryOptions = {}
): Promise<ClubMeeting[]> {
  try {
    const { data, error } = await supabase
      .rpc('get_club_meetings', {
        p_club_id: clubId,
        p_upcoming_only: options.upcoming || false,
        p_limit: options.limit || 50,
        p_offset: options.offset || 0
      });

    if (error) throw error;

    return data || [];
  } catch (error) {
    handleAPIError(error, 'fetch club meetings');
  }
}

/**
 * Get a specific club meeting by ID
 */
export async function getClubMeeting(
  clubId: string,
  meetingId: string
): Promise<ClubMeeting | null> {
  try {
    const { data, error } = await supabase
      .from('club_meetings')
      .select(`
        *,
        profiles:created_by (
          username,
          email
        )
      `)
      .eq('id', meetingId)
      .eq('club_id', clubId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    // Transform the data to include creator_username
    const meeting: ClubMeeting = {
      ...data,
      creator_username: data.profiles?.username || data.profiles?.email || 'Unknown'
    };

    // Remove the profiles object from the response
    delete (meeting as any).profiles;

    return meeting;
  } catch (error) {
    handleAPIError(error, 'fetch club meeting');
  }
}

/**
 * Update a club meeting
 */
export async function updateClubMeeting(
  clubId: string,
  meetingId: string,
  updates: UpdateMeetingRequest
): Promise<ClubMeeting> {
  try {
    const { data, error } = await supabase
      .from('club_meetings')
      .update(updates)
      .eq('id', meetingId)
      .eq('club_id', clubId)
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    handleAPIError(error, 'update club meeting');
  }
}

/**
 * Delete a club meeting
 */
export async function deleteClubMeeting(
  clubId: string,
  meetingId: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('club_meetings')
      .delete()
      .eq('id', meetingId)
      .eq('club_id', clubId);

    if (error) throw error;
  } catch (error) {
    handleAPIError(error, 'delete club meeting');
  }
}

// =====================================================
// Meeting Analytics Functions
// =====================================================

/**
 * Get meeting analytics for a club
 */
export async function getClubMeetingAnalytics(clubId: string): Promise<MeetingAnalytics> {
  try {
    const { data, error } = await supabase
      .rpc('get_club_meeting_analytics', { p_club_id: clubId })
      .single();

    if (error) throw error;

    return {
      total_meetings: data.total_meetings || 0,
      upcoming_meetings: data.upcoming_meetings || 0,
      meetings_this_month: data.meetings_this_month || 0,
      avg_duration_minutes: parseFloat(data.avg_duration_minutes) || 0,
      most_common_type: data.most_common_type || undefined
    };
  } catch (error) {
    handleAPIError(error, 'fetch meeting analytics');
  }
}

// =====================================================
// Notification Management Functions
// =====================================================

/**
 * Get club event notifications for a user
 */
export async function getClubEventNotifications(
  clubId: string,
  userId: string,
  dismissed: boolean = false
): Promise<ClubEventNotification[]> {
  try {
    let query = supabase
      .from('club_event_notifications')
      .select('*')
      .eq('club_id', clubId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!dismissed) {
      query = query.eq('is_dismissed', false);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data || [];
  } catch (error) {
    handleAPIError(error, 'fetch club event notifications');
  }
}

/**
 * Dismiss a club event notification
 */
export async function dismissClubEventNotification(
  notificationId: string,
  userId: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('club_event_notifications')
      .update({
        is_dismissed: true,
        dismissed_at: new Date().toISOString()
      })
      .eq('id', notificationId)
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    handleAPIError(error, 'dismiss notification');
  }
}

/**
 * Create meeting notification manually (for reminders, etc.)
 */
export async function createMeetingNotification(
  meetingId: string,
  clubId: string,
  notificationType: 'meeting_created' | 'meeting_updated' | 'meeting_cancelled' | 'meeting_reminder'
): Promise<void> {
  try {
    const { error } = await supabase
      .rpc('create_meeting_notifications', {
        p_meeting_id: meetingId,
        p_club_id: clubId,
        p_notification_type: notificationType
      });

    if (error) throw error;
  } catch (error) {
    handleAPIError(error, 'create meeting notification');
  }
}

// =====================================================
// Integration with Existing Events System
// =====================================================

/**
 * Get events from the main events system for a club
 */
export async function getClubEvents(clubId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('club_id', clubId)
      .order('start_time', { ascending: true });

    if (error) throw error;

    return data || [];
  } catch (error) {
    handleAPIError(error, 'fetch club events');
  }
}

// =====================================================
// RSVP Management Functions
// =====================================================

/**
 * Create or update an RSVP for a club meeting with attendee limit validation
 */
export async function upsertMeetingRSVP(
  meetingId: string,
  clubId: string,
  userId: string,
  rsvpStatus: RSVPStatus
): Promise<ClubMeetingRSVP> {
  try {
    // First, get meeting details to check attendee limits
    const { data: meeting, error: meetingError } = await supabase
      .from('club_meetings')
      .select('max_attendees, title')
      .eq('id', meetingId)
      .single();

    if (meetingError) throw meetingError;

    // If changing to 'going' and there's an attendee limit, check current count
    if (rsvpStatus === 'going' && meeting.max_attendees) {
      const { data: currentRSVPs, error: countError } = await supabase
        .from('club_meeting_rsvps')
        .select('user_id')
        .eq('meeting_id', meetingId)
        .eq('rsvp_status', 'going')
        .neq('user_id', userId); // Exclude current user

      if (countError) throw countError;

      const currentGoingCount = currentRSVPs?.length || 0;

      if (currentGoingCount >= meeting.max_attendees) {
        throw new Error(`Meeting "${meeting.title}" is full. Maximum attendees: ${meeting.max_attendees}, Current attendees: ${currentGoingCount}`);
      }
    }

    const { data, error } = await supabase
      .from('club_meeting_rsvps')
      .upsert([{
        meeting_id: meetingId,
        club_id: clubId,
        user_id: userId,
        rsvp_status: rsvpStatus
      }], {
        onConflict: 'meeting_id,user_id'
      })
      .select()
      .single();

    if (error) {
      // Handle database trigger errors for attendee limits
      if (error.code === 'P0001' && error.message.includes('Meeting is full')) {
        throw new Error(error.message);
      }
      throw error;
    }

    return data;
  } catch (error) {
    // Re-throw attendee limit errors with original message
    if (error instanceof Error && error.message.includes('full')) {
      throw error;
    }
    handleAPIError(error, 'upsert meeting RSVP');
  }
}

/**
 * Get user's RSVP for a specific meeting
 */
export async function getUserMeetingRSVP(
  meetingId: string,
  userId: string
): Promise<ClubMeetingRSVP | null> {
  try {
    const { data, error } = await supabase
      .from('club_meeting_rsvps')
      .select('*')
      .eq('meeting_id', meetingId)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return data;
  } catch (error) {
    handleAPIError(error, 'fetch user meeting RSVP');
  }
}

/**
 * Get all RSVPs for a specific meeting
 */
export async function getMeetingRSVPs(meetingId: string): Promise<ClubMeetingRSVP[]> {
  try {
    const { data, error } = await supabase
      .from('club_meeting_rsvps')
      .select('*')
      .eq('meeting_id', meetingId)
      .order('rsvp_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    handleAPIError(error, 'fetch meeting RSVPs');
  }
}

/**
 * Get RSVP statistics for a meeting
 */
export async function getMeetingRSVPStats(meetingId: string): Promise<MeetingRSVPStats> {
  try {
    const { data, error } = await supabase
      .rpc('get_meeting_rsvp_stats', {
        p_meeting_id: meetingId
      })
      .single();

    if (error) throw error;

    return {
      total_rsvps: data.total_rsvps || 0,
      going_count: data.going_count || 0,
      maybe_count: data.maybe_count || 0,
      not_going_count: data.not_going_count || 0,
      response_rate: data.response_rate || 0
    };
  } catch (error) {
    handleAPIError(error, 'fetch meeting RSVP stats');
  }
}

/**
 * Get RSVP statistics for all meetings in a club
 */
export async function getClubMeetingRSVPStats(clubId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .rpc('get_club_meeting_rsvp_stats', {
        p_club_id: clubId
      });

    if (error) throw error;

    return data || [];
  } catch (error) {
    handleAPIError(error, 'fetch club meeting RSVP stats');
  }
}

/**
 * Delete an RSVP (user withdraws their response)
 */
export async function deleteMeetingRSVP(
  meetingId: string,
  userId: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('club_meeting_rsvps')
      .delete()
      .eq('meeting_id', meetingId)
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    handleAPIError(error, 'delete meeting RSVP');
  }
}
