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

  const { data, error } = await supabase
    .from('book_clubs')
    .insert([{ ...club, created_by: userId }])
    .select()
    .single();

  if (error) throw error;

  // Add creator as admin member
  await supabase.from('club_members').insert([{ user_id: userId, club_id: data.id, role: 'admin' }]);

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

  const { error } = await supabase.from('book_clubs').delete().eq('id', clubId);
  if (error) throw error;
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
  const { data, error } = await supabase
    .from('current_books')
    .select('*')
    .eq('club_id', clubId)
    .single();

  if (error) throw error;
  return data;
}