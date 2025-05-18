import { supabase } from '@/lib/supabase';

/**
 * Create notifications for all club members when a new event is created
 * @param eventId - The ID of the event
 * @param clubId - The ID of the club
 */
export async function createEventNotifications(eventId: string, clubId: string): Promise<void> {
  try {
    // Get all club members
    const { data: members, error: membersError } = await supabase
      .from('club_members')
      .select('user_id')
      .eq('club_id', clubId);

    if (membersError) {
      console.error('Error fetching club members:', membersError);
      return;
    }

    if (!members || members.length === 0) {
      return;
    }

    // Create notifications for each member
    const notifications = members.map(member => ({
      event_id: eventId,
      user_id: member.user_id,
      is_read: false
    }));

    const { error: notificationsError } = await supabase
      .from('event_notifications')
      .insert(notifications);

    if (notificationsError) {
      console.error('Error creating event notifications:', notificationsError);
    }
  } catch (error) {
    console.error('Error in createEventNotifications:', error);
  }
}
