import { supabase } from '../../supabase';
import { isClubMember, isClubAdmin } from '../auth';

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
    .select('*')
    .eq('topic_id', topicId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * Delete a discussion post
 * Only the post author or a club admin can delete a post
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

  // Check if user is the post author or a club admin
  const isAuthor = post.user_id === userId;
  const isAdmin = await isClubAdmin(userId, topic.club_id);

  if (!isAuthor && !isAdmin) throw new Error('Unauthorized');

  // Delete the post
  const { error } = await supabase
    .from('discussion_posts')
    .delete()
    .eq('id', postId);

  if (error) throw error;
  return { success: true };
}

// Alias for addDiscussionTopic
export const createTopic = addDiscussionTopic;

// Alias for replyToTopic
export const createPost = replyToTopic;

// Alias for deleteDiscussionPost
export const deletePost = deleteDiscussionPost;
