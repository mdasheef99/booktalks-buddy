import { supabase } from '../../supabase';
import { isClubMember } from '../auth';
import { isClubLead } from './permissions';
import { getUserEntitlements } from '@/lib/entitlements/cache';
import { canManageClub, hasContextualEntitlement } from '@/lib/entitlements/permissions';

/**
 * Book Club Discussion Topics and Posts
 */

/**
 * Add a new discussion topic to a book club
 */
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

/**
 * Reply to a discussion topic
 */
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

/**
 * Get all discussion topics for a book club
 */
export async function getClubTopics(userId: string, clubId: string) {
  if (!(await isClubMember(userId, clubId))) throw new Error('Unauthorized');

  const { data, error } = await supabase
    .from('discussion_topics')
    .select('*')
    .eq('club_id', clubId);

  if (error) throw error;
  return data;
}

/**
 * Get all posts for a discussion topic
 */
export async function getDiscussionPosts(topicId: string) {
  const { data, error } = await supabase
    .from('discussion_posts')
    .select(`
      id,
      content,
      user_id,
      parent_post_id,
      topic_id,
      created_at,
      updated_at,
      is_deleted,
      deleted_by,
      deleted_by_moderator
    `)
    .eq('topic_id', topicId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * Check if user has permission to moderate content in a club
 */
async function hasModeratorPermission(userId: string, clubId: string): Promise<boolean> {
  // Get user entitlements for consistent permission checking
  const entitlements = await getUserEntitlements(userId);

  // Check if user has contextual Club Lead entitlement
  const hasClubLeadEntitlement = hasContextualEntitlement(entitlements, 'CLUB_LEAD', clubId);
  if (hasClubLeadEntitlement) return true;

  // Check if user has contextual Club Moderator entitlement
  const hasClubModeratorEntitlement = hasContextualEntitlement(entitlements, 'CLUB_MODERATOR', clubId);
  if (hasClubModeratorEntitlement) return true;

  // Get club's store ID for contextual permission checking
  const { data: club } = await supabase
    .from('book_clubs')
    .select('store_id')
    .eq('id', clubId)
    .single();

  // Check if user has club management permissions using enhanced entitlements
  const canManage = club ? canManageClub(entitlements, clubId, club.store_id) : false;
  if (canManage) return true;

  return false;
}

/**
 * Soft delete a discussion post
 * The post author or a club admin/moderator can delete a post
 */
export async function deleteDiscussionPost(userId: string, postId: string) {
  // First get the post to check ownership and get the topic_id
  const { data: post, error: postError } = await supabase
    .from('discussion_posts')
    .select('user_id, topic_id')
    .eq('id', postId)
    .single();

  if (postError || !post) throw new Error('Post not found');

  // Get the club_id from the topic
  const { data: topic, error: topicError } = await supabase
    .from('discussion_topics')
    .select('club_id')
    .eq('id', post.topic_id)
    .single();

  if (topicError || !topic) throw new Error('Topic not found');

  // Check if user is the post author or has moderator permissions
  const isAuthor = post.user_id === userId;
  const hasModPermission = await hasModeratorPermission(userId, topic.club_id);

  if (!isAuthor && !hasModPermission) throw new Error('Unauthorized');

  // Soft delete the post
  const { error } = await supabase
    .from('discussion_posts')
    .update({
      is_deleted: true,
      deleted_by: userId,
      deleted_by_moderator: hasModPermission && !isAuthor, // Only mark as deleted by moderator if it's not the author
      deleted_at: new Date().toISOString()
    })
    .eq('id', postId);

  if (error) throw error;
  return {
    success: true,
    id: postId,
    is_deleted: true,
    deleted_by_moderator: hasModPermission && !isAuthor
  };
}

// Alias for addDiscussionTopic
export const createTopic = addDiscussionTopic;

// Alias for replyToTopic
export const createPost = replyToTopic;

// Alias for deleteDiscussionPost
export const deletePost = deleteDiscussionPost;
