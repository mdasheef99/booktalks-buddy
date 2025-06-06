import { supabase } from '@/lib/supabase';
import { hasContextualEntitlement } from '@/lib/entitlements';
import { getUserEntitlements } from '@/lib/entitlements/cache';
import { Event } from './types';

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
 * @param upcomingOnly - Whether to only return upcoming events
 * @returns Array of events
 */
export async function getClubEvents(clubId: string, upcomingOnly: boolean = false): Promise<Event[]> {
  let query = supabase
    .from('events')
    .select('*')
    .eq('club_id', clubId);

  // Filter for upcoming events if requested
  if (upcomingOnly) {
    const now = new Date().toISOString();
    query = query.gte('start_time', now);
  }

  // Order by start time
  const { data, error } = await query.order('start_time', { ascending: true });

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
                         hasContextualEntitlement(entitlements, 'STORE_MANAGER', storeId) ||
                         entitlements.includes('CAN_MANAGE_EVENTS') ||
                         entitlements.includes('CAN_MANAGE_ALL_STORES');

  if (!hasPermission) {
    console.log('🚨 Store events permission check failed for user:', userId);
    console.log('📍 Store ID:', storeId);
    console.log('🔑 User entitlements:', entitlements);
    console.log('🔍 Looking for: STORE_OWNER_' + storeId + ' or STORE_MANAGER_' + storeId);
    console.log('🔍 Or general permissions: CAN_MANAGE_EVENTS, CAN_MANAGE_ALL_STORES');
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
  let hasStorePermission = false;
  if (event.store_id) {
    hasStorePermission = hasContextualEntitlement(entitlements, 'STORE_OWNER', event.store_id) ||
                        hasContextualEntitlement(entitlements, 'STORE_MANAGER', event.store_id) ||
                        entitlements.includes('CAN_MANAGE_EVENTS') ||
                        entitlements.includes('CAN_MANAGE_ALL_STORES');
  }

  if (!hasStorePermission) {
    console.log('🚨 Toggle featured permission check failed for user:', userId);
    console.log('📍 Event ID:', eventId);
    console.log('📍 Store ID:', event.store_id);
    console.log('🔑 User entitlements:', entitlements);
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
