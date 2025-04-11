import { supabase } from '../../supabase';
import { isClubMember } from '../auth';

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

// Alias for addDiscussionTopic
export const createTopic = addDiscussionTopic;

// Alias for replyToTopic
export const createPost = replyToTopic;
