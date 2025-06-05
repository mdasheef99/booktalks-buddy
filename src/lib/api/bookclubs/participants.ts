import { supabase } from '../../supabase';
import { isClubMember } from '../auth';
import { Database } from '@/integrations/supabase/types';
import { getEvent } from './events/queries';

/**
 * Event Participants Management
 */

// Type definitions
export type EventParticipant = Database['public']['Tables']['event_participants']['Row'];
export type EventParticipantInsert = Database['public']['Tables']['event_participants']['Insert'];
export type EventParticipantUpdate = Database['public']['Tables']['event_participants']['Update'];

/**
 * RSVP to an event with attendee limit validation
 * @param userId - The ID of the user RSVPing
 * @param eventId - The ID of the event
 * @param rsvpStatus - The RSVP status ('going', 'maybe', 'not_going')
 * @returns The RSVP record
 */
export async function rsvpToEvent(
  userId: string,
  eventId: string,
  rsvpStatus: 'going' | 'maybe' | 'not_going'
): Promise<EventParticipant> {
  // Get the event to check if it's a club event and get attendee limits
  const event = await getEvent(eventId);

  // If it's a club event, check if the user is a member of the club
  if (event.club_id) {
    const isMember = await isClubMember(userId, event.club_id);
    if (!isMember) {
      throw new Error('Unauthorized: Only club members can RSVP to club events');
    }
  }

  // If changing to 'going' and there's a participant limit, check current count
  if (rsvpStatus === 'going' && event.max_participants) {
    const { data: currentParticipants, error: countError } = await supabase
      .from('event_participants')
      .select('user_id')
      .eq('event_id', eventId)
      .eq('rsvp_status', 'going')
      .neq('user_id', userId); // Exclude current user

    if (countError) {
      console.error('Error checking participant count:', countError);
      throw countError;
    }

    const currentGoingCount = currentParticipants?.length || 0;

    if (currentGoingCount >= event.max_participants) {
      throw new Error(`Event "${event.title}" is full. Maximum participants: ${event.max_participants}, Current participants: ${currentGoingCount}`);
    }
  }

  // Check if the user has already RSVPed to this event
  const { data: existingRsvp, error: fetchError } = await supabase
    .from('event_participants')
    .select('*')
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .maybeSingle();

  if (fetchError) {
    console.error('Error checking existing RSVP:', fetchError);
    throw fetchError;
  }

  // If the user has already RSVPed, update the status
  if (existingRsvp) {
    const { data, error } = await supabase
      .from('event_participants')
      .update({
        rsvp_status: rsvpStatus,
        rsvp_at: new Date().toISOString()
      })
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      // Handle database trigger errors for attendee limits
      if (error.code === 'P0001' && error.message.includes('Event is full')) {
        throw new Error(error.message);
      }
      console.error('Error updating RSVP:', error);
      throw error;
    }

    return data;
  }

  // Otherwise, create a new RSVP
  const { data, error } = await supabase
    .from('event_participants')
    .insert([{
      event_id: eventId,
      user_id: userId,
      rsvp_status: rsvpStatus,
      rsvp_at: new Date().toISOString()
    }])
    .select()
    .single();

  if (error) {
    // Handle database trigger errors for attendee limits
    if (error.code === 'P0001' && error.message.includes('Event is full')) {
      throw new Error(error.message);
    }
    console.error('Error creating RSVP:', error);
    throw error;
  }

  return data;
}

/**
 * Cancel an RSVP to an event
 * @param userId - The ID of the user canceling the RSVP
 * @param eventId - The ID of the event
 * @returns Success status
 */
export async function cancelRsvp(
  userId: string,
  eventId: string
): Promise<{ success: boolean }> {
  const { error } = await supabase
    .from('event_participants')
    .delete()
    .eq('event_id', eventId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error canceling RSVP:', error);
    throw error;
  }

  return { success: true };
}

/**
 * Get all participants for an event
 * @param eventId - The ID of the event
 * @returns Array of participants with user details
 */
export async function getEventParticipants(
  eventId: string
): Promise<(EventParticipant & { user: { username: string | null, email: string } })[]> {
  // First, get all participants for this event
  const { data: participants, error: participantsError } = await supabase
    .from('event_participants')
    .select('*')
    .eq('event_id', eventId);

  if (participantsError) {
    console.error('Error fetching event participants:', participantsError);
    throw participantsError;
  }

  if (!participants || participants.length === 0) {
    return [];
  }

  // Then, for each participant, get the user details
  const result = await Promise.all(
    participants.map(async (participant) => {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('username, email')
        .eq('id', participant.user_id)
        .single();

      if (userError) {
        console.warn(`Could not fetch user details for user_id ${participant.user_id}:`, userError);
        return {
          ...participant,
          user: { username: null, email: '' }
        };
      }

      return {
        ...participant,
        user: {
          username: userData?.username || null,
          email: userData?.email || ''
        }
      };
    })
  );

  return result;
}

/**
 * Get the RSVP status for a user for an event
 * @param userId - The ID of the user
 * @param eventId - The ID of the event
 * @returns The RSVP record or null if not found
 */
export async function getUserRsvpStatus(
  userId: string,
  eventId: string
): Promise<EventParticipant | null> {
  const { data, error } = await supabase
    .from('event_participants')
    .select('*')
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching user RSVP status:', error);
    throw error;
  }

  return data;
}

/**
 * Get all events a user has RSVPed to
 * @param userId - The ID of the user
 * @returns Array of events with RSVP status
 */
export async function getUserRsvpEvents(
  userId: string
): Promise<(EventParticipant & { event: Database['public']['Tables']['events']['Row'] })[]> {
  // First, get all RSVPs for this user
  const { data: rsvps, error: rsvpsError } = await supabase
    .from('event_participants')
    .select('*')
    .eq('user_id', userId);

  if (rsvpsError) {
    console.error('Error fetching user RSVPs:', rsvpsError);
    throw rsvpsError;
  }

  if (!rsvps || rsvps.length === 0) {
    return [];
  }

  // Then, for each RSVP, get the event details
  const result = await Promise.all(
    rsvps.map(async (rsvp) => {
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', rsvp.event_id)
        .single();

      if (eventError) {
        console.warn(`Could not fetch event details for event_id ${rsvp.event_id}:`, eventError);
        return {
          ...rsvp,
          event: {} as Database['public']['Tables']['events']['Row']
        };
      }

      return {
        ...rsvp,
        event: eventData
      };
    })
  );

  return result;
}

/**
 * Get the count of participants for an event by RSVP status
 * @param eventId - The ID of the event
 * @returns Object with counts for each RSVP status
 */
export async function getEventParticipantCounts(
  eventId: string
): Promise<{ going: number; maybe: number; not_going: number }> {
  const { data, error } = await supabase
    .from('event_participants')
    .select('rsvp_status')
    .eq('event_id', eventId);

  if (error) {
    console.error('Error fetching event participant counts:', error);
    throw error;
  }

  const counts = {
    going: 0,
    maybe: 0,
    not_going: 0
  };

  if (data) {
    data.forEach(participant => {
      if (participant.rsvp_status === 'going') counts.going++;
      else if (participant.rsvp_status === 'maybe') counts.maybe++;
      else if (participant.rsvp_status === 'not_going') counts.not_going++;
    });
  }

  return counts;
}
