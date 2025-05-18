import { supabase } from '../../supabase';
import { hasContextualEntitlement } from '@/lib/entitlements';
import { getUserEntitlements } from '@/lib/entitlements/cache';
import { Database } from '@/integrations/supabase/types';
import { uploadEventImage as processEventImage, deleteEventImages } from '@/lib/utils/image-processing';
import { ImageUploadResponse } from '@/types/event-images';

/**
 * Book Club Events Management
 */

// Type definitions
export type Event = Database['public']['Tables']['events']['Row'];
export type EventInsert = Database['public']['Tables']['events']['Insert'];
export type EventUpdate = Database['public']['Tables']['events']['Update'];

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

/**
 * Get a specific event by ID
 * @param eventId - The ID of the event to get
 * @returns The event
 */
export async function getEvent(eventId: string): Promise<Event> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single();

  if (error) {
    console.error('Error fetching event:', error);
    throw error;
  }

  return data;
}

/**
 * Get all events for a specific club
 * @param clubId - The ID of the club
 * @returns Array of events
 */
export async function getClubEvents(clubId: string): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('club_id', clubId)
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Error fetching club events:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get all events for a specific store
 * @param userId - The ID of the user requesting the events
 * @param storeId - The ID of the store
 * @returns Array of events
 */
export async function getStoreEvents(userId: string, storeId: string): Promise<Event[]> {
  // Get the user's entitlements
  const entitlements = await getUserEntitlements(userId);

  // Check if the user has permission to view store events
  const hasPermission = hasContextualEntitlement(entitlements, 'STORE_OWNER', storeId) ||
                         hasContextualEntitlement(entitlements, 'STORE_MANAGER', storeId);

  if (!hasPermission) {
    throw new Error('Unauthorized: Only store owners and managers can view all store events');
  }

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('store_id', storeId)
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Error fetching store events:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get events featured on the landing page
 * @returns Array of featured events
 */
export async function getFeaturedEvents(): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('featured_on_landing', true)
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Error fetching featured events:', error);
    throw error;
  }

  return data || [];
}

/**
 * Toggle whether an event is featured on the landing page
 * @param userId - The ID of the user toggling the feature status
 * @param eventId - The ID of the event to toggle
 * @param featured - Whether the event should be featured
 * @returns The updated event
 */
export async function toggleEventFeatured(
  userId: string,
  eventId: string,
  featured: boolean
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

  // Check if the user has permission to feature this event
  const hasStorePermission = event.store_id ?
    hasContextualEntitlement(entitlements, 'STORE_OWNER', event.store_id) ||
    hasContextualEntitlement(entitlements, 'STORE_MANAGER', event.store_id) :
    false;

  if (!hasStorePermission) {
    throw new Error('Unauthorized: Only store owners and managers can feature events');
  }

  // Update the event
  const { data, error } = await supabase
    .from('events')
    .update({ featured_on_landing: featured })
    .eq('id', eventId)
    .select()
    .single();

  if (error) {
    console.error('Error updating event featured status:', error);
    throw error;
  }

  return data;
}

/**
 * Create notifications for all club members when a new event is created
 * @param eventId - The ID of the event
 * @param clubId - The ID of the club
 */
async function createEventNotifications(eventId: string, clubId: string): Promise<void> {
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

/**
 * Upload an image for an event
 * @param userId - The ID of the user uploading the image
 * @param eventId - The ID of the event
 * @param file - The image file to upload
 * @param altText - Optional alt text for the image
 * @param onProgress - Optional progress callback
 * @returns The uploaded image URLs and metadata
 */
export async function uploadEventImage(
  userId: string,
  eventId: string,
  file: File,
  altText: string = '',
  onProgress?: (progress: number) => void
): Promise<ImageUploadResponse> {
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
    throw new Error('Unauthorized: Only the event creator or store owners/managers can upload images');
  }

  try {
    // Upload the image and get URLs
    const imageData = await processEventImage(file, eventId, userId, altText, onProgress);

    // Update the event with the image URLs
    const { error } = await supabase
      .from('events')
      .update({
        image_url: imageData.imageUrl,
        thumbnail_url: imageData.thumbnailUrl,
        medium_url: imageData.mediumUrl,
        image_alt_text: altText,
        image_metadata: imageData.metadata
      })
      .eq('id', eventId)
      .select()
      .single();

    if (error) {
      console.error('Error updating event with image URLs:', error);
      throw error;
    }

    return imageData;
  } catch (error) {
    console.error('Error in uploadEventImage:', error);
    throw error;
  }
}

/**
 * Remove an image from an event
 * @param userId - The ID of the user removing the image
 * @param eventId - The ID of the event
 * @returns Success status
 */
export async function removeEventImage(
  userId: string,
  eventId: string
): Promise<{ success: boolean }> {
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
    throw new Error('Unauthorized: Only the event creator or store owners/managers can remove images');
  }

  try {
    // Delete the images from storage
    if (event.image_url) {
      await deleteEventImages(eventId, userId);
    }

    // Update the event to remove image references
    const { error } = await supabase
      .from('events')
      .update({
        image_url: null,
        thumbnail_url: null,
        medium_url: null,
        image_alt_text: null,
        image_metadata: null
      })
      .eq('id', eventId)
      .select()
      .single();

    if (error) {
      console.error('Error updating event to remove image references:', error);
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error in removeEventImage:', error);
    throw error;
  }
}
