import { supabase } from '../../supabase';
import { isClubAdmin } from '../auth';
import { getUserEntitlements } from '@/lib/entitlements/cache';
import { canManageClub } from '@/lib/entitlements/permissions';

/**
 * Book Club CRUD operations
 */

/**
 * Create a new book club
 */
export async function createBookClub(userId: string, club: { name: string; description?: string; privacy?: string }) {
  if (!club.name) throw new Error('Club name is required');

  console.log('Creating book club with data:', {
    name: club.name,
    description: club.description,
    privacy: club.privacy,
    lead_user_id: userId,
    access_tier_required: 'free'
  });

  // Include lead_user_id which is required (NOT NULL constraint)
  const { data, error } = await supabase
    .from('book_clubs')
    .insert([{
      name: club.name,
      description: club.description,
      privacy: club.privacy,
      lead_user_id: userId,
      access_tier_required: 'free' // Default to free access tier
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating book club:', error);
    throw error;
  }

  console.log('Book club created successfully:', data);

  // Add creator as admin member
  const { error: memberError } = await supabase
    .from('club_members')
    .insert([{ user_id: userId, club_id: data.id, role: 'admin' }]);

  if (memberError) {
    console.error('Error adding creator as admin:', memberError);
    throw memberError;
  }

  return data;
}

/**
 * Update an existing book club
 */
export async function updateBookClub(userId: string, clubId: string, updates: { name?: string; description?: string; privacy?: string }) {
  // Get user entitlements and check club management permission
  const entitlements = await getUserEntitlements(userId);

  // Get club's store ID for contextual permission checking
  const { data: club } = await supabase
    .from('book_clubs')
    .select('store_id')
    .eq('id', clubId)
    .single();

  const canManage = club ? canManageClub(entitlements, clubId, club.store_id) : false;

  if (!canManage) {
    console.log('🚨 Club update permission check failed for user:', userId);
    console.log('📍 Club ID:', clubId);
    console.log('🔑 User entitlements:', entitlements);
    throw new Error('Unauthorized: Only club administrators can update club settings');
  }

  const { data, error } = await supabase
    .from('book_clubs')
    .update(updates)
    .eq('id', clubId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete a book club and all associated data
 */
export async function deleteBookClub(userId: string, clubId: string) {
  // Get user entitlements and check club management permission
  const entitlements = await getUserEntitlements(userId);

  // Get club's store ID for contextual permission checking
  const { data: club } = await supabase
    .from('book_clubs')
    .select('store_id')
    .eq('id', clubId)
    .single();

  const canManage = club ? canManageClub(entitlements, clubId, club.store_id) : false;

  if (!canManage) {
    console.log('🚨 Club deletion permission check failed for user:', userId);
    console.log('📍 Club ID:', clubId);
    console.log('🔑 User entitlements:', entitlements);
    throw new Error('Unauthorized: Only club administrators can delete clubs');
  }

  console.log('Deleting book club:', clubId);

  // First delete all members
  console.log('Deleting club members first...');
  const { error: memberError } = await supabase
    .from('club_members')
    .delete()
    .eq('club_id', clubId);

  if (memberError) {
    console.error('Error deleting club members:', memberError);
    throw memberError;
  }

  // Then delete any discussion topics and posts
  console.log('Deleting discussion topics and posts...');
  try {
    // Get all topic IDs for this club
    const { data: topics } = await supabase
      .from('discussion_topics')
      .select('id')
      .eq('club_id', clubId);

    if (topics && topics.length > 0) {
      const topicIds = topics.map(t => t.id);

      // Delete all posts for these topics
      await supabase
        .from('discussion_posts')
        .delete()
        .in('topic_id', topicIds);

      // Delete the topics
      await supabase
        .from('discussion_topics')
        .delete()
        .eq('club_id', clubId);
    }
  } catch (error) {
    console.error('Error deleting topics/posts:', error);
    // Continue with deletion even if this fails
  }

  // Delete current book if exists
  console.log('Deleting current book if exists...');
  try {
    await supabase
      .from('current_books')
      .delete()
      .eq('club_id', clubId);
  } catch (error) {
    console.error('Error deleting current book:', error);
    // Continue with deletion even if this fails
  }

  // Finally delete the club
  console.log('Deleting the book club...');
  const { error } = await supabase
    .from('book_clubs')
    .delete()
    .eq('id', clubId);

  if (error) {
    console.error('Error deleting book club:', error);
    throw error;
  }

  console.log('Book club deleted successfully');
  return { success: true };
}

/**
 * List all book clubs a user is a member of
 */
export async function listBookClubs(userId: string) {
  console.log('[listBookClubs] called with userId:', userId);

  // First, get club IDs where user is a member (excluding pending requests)
  const { data: memberData, error: memberError } = await supabase
    .from('club_members')
    .select('club_id')
    .eq('user_id', userId)
    .not('role', 'eq', 'pending');

  console.log('[listBookClubs] memberData:', memberData, 'memberError:', memberError);

  if (memberError) throw memberError;
  const clubIds = memberData?.map((m) => m.club_id) ?? [];

  console.log('[listBookClubs] clubIds:', clubIds);

  if (clubIds.length === 0) {
    console.log('[listBookClubs] No clubs found for user');
    return [];
  }

  const { data, error } = await supabase
    .from('book_clubs')
    .select('*')
    .in('id', clubIds);

  console.log('[listBookClubs] book_clubs data:', data, 'error:', error);

  if (error) throw error;
  return data;
}

/**
 * Get details of a single club
 */
export async function getClubDetails(clubId: string) {
  const { data, error } = await supabase
    .from('book_clubs')
    .select('*')
    .eq('id', clubId)
    .single();

  if (error) throw error;
  return data;
}

// Alias for listBookClubs
export const getClubs = listBookClubs;
