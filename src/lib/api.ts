/**
 * Common API utility functions
 */

export interface ApiRequestOptions extends RequestInit {
  queryParams?: Record<string, string | number | boolean | undefined>;
}

/**
 * Helper to build query string from params
 */
function buildQueryString(params?: Record<string, string | number | boolean | undefined>): string {
  if (!params) return '';
  const esc = encodeURIComponent;
  const query = Object.entries(params)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${esc(k)}=${esc(String(v))}`)
    .join('&');
  return query ? `?${query}` : '';
}

/**
 * Generic API fetch wrapper
 */
export async function apiFetch<T>(
  url: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { queryParams, headers, ...rest } = options;
  const fullUrl = url + buildQueryString(queryParams);

  const response = await fetch(fullUrl, {
    headers: {
      'Content-Type': 'application/json',
      ...(headers || {}),
    },
    ...rest,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error ${response.status}: ${errorText}`);
  }

  return response.json() as Promise<T>;
}

// ================= Book Club API Functions =================

import { supabase, apiCall } from './supabase';

// Contextual role check helpers
async function isClubAdmin(userId: string, clubId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('club_members')
    .select('role')
    .eq('user_id', userId)
    .eq('club_id', clubId)
    .single();

  if (error || !data) return false;
  return data.role === 'admin';
}

async function isClubMember(userId: string, clubId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('club_members')
    .select('role')
    .eq('user_id', userId)
    .eq('club_id', clubId)
    .single();

  return !!data && !error;
}

// Book Club CRUD
export async function createBookClub(userId: string, club: { name: string; description?: string; privacy?: string }) {
  if (!club.name) throw new Error('Club name is required');

  console.log('Creating book club with data:', { name: club.name, description: club.description, privacy: club.privacy });

  // Remove created_by if it doesn't exist in the schema
  const { data, error } = await supabase
    .from('book_clubs')
    .insert([{
      name: club.name,
      description: club.description,
      privacy: club.privacy
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

export async function updateBookClub(userId: string, clubId: string, updates: { name?: string; description?: string; privacy?: string }) {
  if (!(await isClubAdmin(userId, clubId))) throw new Error('Unauthorized');

  const { data, error } = await supabase
    .from('book_clubs')
    .update(updates)
    .eq('id', clubId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteBookClub(userId: string, clubId: string) {
  if (!(await isClubAdmin(userId, clubId))) throw new Error('Unauthorized');

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

export async function listBookClubs(userId: string) {
  console.log('[listBookClubs] called with userId:', userId);

  // First, get club IDs where user is a member
  const { data: memberData, error: memberError } = await supabase
    .from('club_members')
    .select('club_id')
    .eq('user_id', userId);

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

// Membership
export async function joinClub(userId: string, clubId: string) {
  // Check if already a member
  if (await isClubMember(userId, clubId)) throw new Error('Already a member');

  const { error } = await supabase.from('club_members').insert([{ user_id: userId, club_id: clubId, role: 'member' }]);
  if (error) throw error;
  return { success: true };
}

export async function leaveClub(userId: string, clubId: string) {
  const { error } = await supabase.from('club_members').delete().eq('user_id', userId).eq('club_id', clubId);
  if (error) throw error;
  return { success: true };
}

// Discussion Topics
export async function addDiscussionTopic(userId: string, clubId: string, title: string) {
  if (!title) throw new Error('Title is required');
  if (!(await isClubMember(userId, clubId))) throw new Error('Unauthorized');

  const { data, error } = await supabase
    .from('discussion_topics')
    .insert([{ club_id: clubId, user_id: userId, title }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function replyToTopic(userId: string, topicId: string, content: string, parentPostId?: string) {
  if (!content) throw new Error('Content is required');

  // Check if user is member of the club for this topic
  const { data: topic, error: topicError } = await supabase
    .from('discussion_topics')
    .select('club_id')
    .eq('id', topicId)
    .single();

  if (topicError || !topic) throw new Error('Topic not found');

  if (!(await isClubMember(userId, topic.club_id))) throw new Error('Unauthorized');

  const { data, error } = await supabase
    .from('discussion_posts')
    .insert([{ topic_id: topicId, user_id: userId, content, parent_post_id: parentPostId || null }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getClubTopics(userId: string, clubId: string) {
  if (!(await isClubMember(userId, clubId))) throw new Error('Unauthorized');

  const { data, error } = await supabase
    .from('discussion_topics')
    .select('*')
    .eq('club_id', clubId);

  if (error) throw error;
  return data;
}

export async function setCurrentBook(userId: string, clubId: string, book: { title: string; author: string }) {
  if (!(await isClubAdmin(userId, clubId))) throw new Error('Unauthorized');

  const { data, error } = await supabase
    .from('current_books')
    .upsert([{ club_id: clubId, title: book.title, author: book.author, set_at: new Date().toISOString() }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Admin functions
export async function listAdminMembers(userId: string) {
  // Check if user is a global admin (assumed via Auth metadata or separate check)
  // For now, assume all authenticated users can list members (adjust as needed)
  const { data, error } = await supabase.from('users').select('*');
  if (error) throw error;
  return data;
}

export async function removeMember(adminId: string, userIdToRemove: string, clubId: string) {
  if (!(await isClubAdmin(adminId, clubId))) throw new Error('Unauthorized');

  const { error } = await supabase
    .from('club_members')
    .delete()
    .eq('user_id', userIdToRemove)
    .eq('club_id', clubId);

  if (error) throw error;
  return { success: true };
}

export async function inviteMember(adminId: string, clubId: string, inviteeEmail: string) {
  if (!(await isClubAdmin(adminId, clubId))) throw new Error('Unauthorized');

  // Implement invite logic (e.g., insert into invites table or send email)
  // Placeholder implementation:
  return { success: true, message: 'Invite sent (placeholder)' };
}

/*
// --- handleJoinRequest removed due to Supabase type errors ---
// Uncomment and fix Supabase types if 'join_requests' table is added to types
// export async function handleJoinRequest(...) { ... }
*/

/**
 * Additional Book Club API functions (Step 4)
 */

// Alias for listBookClubs
export const getClubs = listBookClubs;

// Get details of a single club
export async function getClubDetails(clubId: string) {
  const { data, error } = await supabase
    .from('book_clubs')
    .select('*')
    .eq('id', clubId)
    .single();

  if (error) throw error;
  return data;
}

// Get members of a club
export async function getClubMembers(clubId: string) {
  const { data, error } = await supabase
    .from('club_members')
    .select('*')
    .eq('club_id', clubId);

  if (error) throw error;
  return data;
}

// Add a member to a club (admin only)
export async function addClubMember(adminId: string, clubId: string, userId: string, role: string = 'member') {
  if (!(await isClubAdmin(adminId, clubId))) throw new Error('Unauthorized');

  const { error } = await supabase
    .from('club_members')
    .insert([{ user_id: userId, club_id: clubId, role }]);

  if (error) throw error;
  return { success: true };
}

// Update a member's role (admin only)
export async function updateMemberRole(adminId: string, clubId: string, userId: string, newRole: string) {
  if (!(await isClubAdmin(adminId, clubId))) throw new Error('Unauthorized');

  const { error } = await supabase
    .from('club_members')
    .update({ role: newRole })
    .eq('user_id', userId)
    .eq('club_id', clubId);

  if (error) throw error;
  return { success: true };
}

// Get discussion posts for a topic
export async function getDiscussionPosts(topicId: string) {
  const { data, error } = await supabase
    .from('discussion_posts')
    .select('*')
    .eq('topic_id', topicId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

// Alias for addDiscussionTopic
export const createTopic = addDiscussionTopic;

// Alias for replyToTopic
export const createPost = replyToTopic;

// Get current book for a club
export async function getCurrentBook(clubId: string) {
  console.log('Getting current book for club:', clubId);

  try {
    // First check if the current_books table exists and has the expected structure
    const { error: tableError } = await supabase
      .from('current_books')
      .select('count')
      .limit(1);

    if (tableError) {
      console.error('Error checking current_books table:', tableError);
      // Return null instead of throwing an error
      return null;
    }

    // Now try to get the current book
    const { data, error } = await supabase
      .from('current_books')
      .select('*')
      .eq('club_id', clubId)
      .maybeSingle(); // Use maybeSingle instead of single to avoid errors when no record exists

    if (error) {
      console.error('Error getting current book:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error getting current book:', error);
    return null; // Return null instead of throwing to avoid breaking the UI
  }
}