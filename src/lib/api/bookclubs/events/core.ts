import { supabase } from '@/lib/supabase';
import { hasContextualEntitlement } from '@/lib/entitlements';
import { getUserEntitlements } from '@/lib/entitlements/cache';
import { Event, EventInsert, EventUpdate } from './types';
import { createEventNotifications } from './notifications';
import { deleteEventImages } from '@/lib/utils/image-processing';

/**
 * Create a new event
 * @param userId - The ID of the user creating the event
 * @param storeId - The ID of the store the event belongs to
 * @param eventData - The event data to insert
 * @returns The created event
 */
export async function createEvent(
  userId: string,
  storeId: string,
  eventData: Omit<EventInsert, 'id' | 'created_at' | 'created_by' | 'updated_at'>
): Promise<Event> {
  // Get the user's entitlements
  const entitlements = await getUserEntitlements(userId);

  // Check if the user has permission to create events for this store
  const hasPermission = hasContextualEntitlement(entitlements, 'STORE_OWNER', storeId) ||
                         hasContextualEntitlement(entitlements, 'STORE_MANAGER', storeId);

  if (!hasPermission) {
    throw new Error('Unauthorized: Only store owners and managers can create events');
  }

  // Prepare the event data
  const newEvent: EventInsert = {
    ...eventData,
    store_id: storeId,
    created_by: userId,
  };

  // Insert the event
  const { data, error } = await supabase
    .from('events')
    .insert([newEvent])
    .select()
    .single();

  if (error) {
    console.error('Error creating event:', error);
    throw error;
  }

  // If the event is for a specific club, create notifications for all club members
  if (data.club_id) {
    await createEventNotifications(data.id, data.club_id);
  }

  return data;
}

/**
 * Update an existing event
 * @param userId - The ID of the user updating the event
 * @param eventId - The ID of the event to update
 * @param eventData - The event data to update
 * @returns The updated event
 */
export async function updateEvent(
  userId: string,
  eventId: string,
  eventData: EventUpdate
): Promise<Event> {
  // Get the event to check permissions
  const { data: event, error: fetchError } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single();

  if (fetchError) {
    console.error('Error fetching event:', fetchError);
    throw fetchError;
  }

  // Get the user's entitlements
  const entitlements = await getUserEntitlements(userId);

  // Check if the user has permission to update this event
  const isCreator = event.created_by === userId;
  const hasStorePermission = event.store_id ?
    hasContextualEntitlement(entitlements, 'STORE_OWNER', event.store_id) ||
    hasContextualEntitlement(entitlements, 'STORE_MANAGER', event.store_id) :
    false;

  if (!isCreator && !hasStorePermission) {
    throw new Error('Unauthorized: Only the event creator or store owners/managers can update events');
  }

  // Update the event
  const { data, error } = await supabase
    .from('events')
    .update(eventData)
    .eq('id', eventId)
    .select()
    .single();

  if (error) {
    console.error('Error updating event:', error);
    throw error;
  }

  return data;
}

/**
 * Delete an event
 * @param userId - The ID of the user deleting the event
 * @param eventId - The ID of the event to delete
 * @returns Success status
 */
export async function deleteEvent(userId: string, eventId: string): Promise<{ success: boolean }> {
  // Get the event to check permissions
  const { data: event, error: fetchError } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single();

  if (fetchError) {
    console.error('Error fetching event:', fetchError);
    throw fetchError;
  }

  // Get the user's entitlements
  const entitlements = await getUserEntitlements(userId);

  // Check if the user has permission to delete this event
  const isCreator = event.created_by === userId;
  const hasStorePermission = event.store_id ?
    hasContextualEntitlement(entitlements, 'STORE_OWNER', event.store_id) ||
    hasContextualEntitlement(entitlements, 'STORE_MANAGER', event.store_id) :
    false;

  if (!isCreator && !hasStorePermission) {
    throw new Error('Unauthorized: Only the event creator or store owners/managers can delete events');
  }

  try {
    // Delete associated images if they exist
    if (event.image_url) {
      await deleteEventImages(eventId, userId);
    }

    // Delete the event
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId);

    if (error) {
      console.error('Error deleting event:', error);
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error in deleteEvent:', error);
    throw error;
  }
}
