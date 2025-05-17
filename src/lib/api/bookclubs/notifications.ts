import { supabase } from '../../supabase';
import { Database } from '@/integrations/supabase/types';

/**
 * Event Notifications Management
 */

// Type definitions
export type EventNotification = Database['public']['Tables']['event_notifications']['Row'];
export type EventNotificationInsert = Database['public']['Tables']['event_notifications']['Insert'];
export type EventNotificationUpdate = Database['public']['Tables']['event_notifications']['Update'];

/**
 * Get unread event notifications for a user
 * @param userId - The ID of the user
 * @returns Array of unread notifications with event details
 */
export async function getUnreadEventNotifications(
  userId: string
): Promise<(EventNotification & { event: Database['public']['Tables']['events']['Row'] })[]> {
  const { data, error } = await supabase
    .from('event_notifications')
    .select(`
      *,
      event:event_id (*)
    `)
    .eq('user_id', userId)
    .eq('is_read', false)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching unread event notifications:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get all event notifications for a user
 * @param userId - The ID of the user
 * @returns Array of notifications with event details
 */
export async function getAllEventNotifications(
  userId: string
): Promise<(EventNotification & { event: Database['public']['Tables']['events']['Row'] })[]> {
  const { data, error } = await supabase
    .from('event_notifications')
    .select(`
      *,
      event:event_id (*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching all event notifications:', error);
    throw error;
  }

  return data || [];
}

/**
 * Mark an event notification as read
 * @param userId - The ID of the user
 * @param notificationId - The ID of the notification
 * @returns The updated notification
 */
export async function markEventNotificationAsRead(
  userId: string,
  notificationId: string
): Promise<EventNotification> {
  const { data, error } = await supabase
    .from('event_notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('user_id', userId) // Ensure the user owns this notification
    .select()
    .single();

  if (error) {
    console.error('Error marking event notification as read:', error);
    throw error;
  }

  return data;
}

/**
 * Mark all event notifications as read for a user
 * @param userId - The ID of the user
 * @returns Success status
 */
export async function markAllEventNotificationsAsRead(
  userId: string
): Promise<{ success: boolean }> {
  const { error } = await supabase
    .from('event_notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) {
    console.error('Error marking all event notifications as read:', error);
    throw error;
  }

  return { success: true };
}

/**
 * Get the count of unread event notifications for a user
 * @param userId - The ID of the user
 * @returns The count of unread notifications
 */
export async function getUnreadEventNotificationsCount(
  userId: string
): Promise<number> {
  const { count, error } = await supabase
    .from('event_notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) {
    console.error('Error fetching unread event notifications count:', error);
    throw error;
  }

  return count || 0;
}

/**
 * Create a notification for a user about an event
 * @param eventId - The ID of the event
 * @param userId - The ID of the user
 * @returns The created notification
 */
export async function createEventNotification(
  eventId: string,
  userId: string
): Promise<EventNotification> {
  const { data, error } = await supabase
    .from('event_notifications')
    .insert([{
      event_id: eventId,
      user_id: userId,
      is_read: false
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating event notification:', error);
    throw error;
  }

  return data;
}

/**
 * Delete a notification
 * @param userId - The ID of the user
 * @param notificationId - The ID of the notification
 * @returns Success status
 */
export async function deleteEventNotification(
  userId: string,
  notificationId: string
): Promise<{ success: boolean }> {
  const { error } = await supabase
    .from('event_notifications')
    .delete()
    .eq('id', notificationId)
    .eq('user_id', userId); // Ensure the user owns this notification

  if (error) {
    console.error('Error deleting event notification:', error);
    throw error;
  }

  return { success: true };
}

/**
 * Subscribe to real-time updates for event notifications
 * @param userId - The ID of the user
 * @param callback - The callback function to call when a notification is received
 * @returns The subscription object
 */
export function subscribeToEventNotifications(
  userId: string,
  callback: (notification: EventNotification) => void
) {
  return supabase
    .channel(`event-notifications-${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'event_notifications',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        callback(payload.new as EventNotification);
      }
    )
    .subscribe();
}
