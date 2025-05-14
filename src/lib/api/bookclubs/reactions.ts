import { supabase } from '../../supabase';
import { isClubMember } from '../auth';

/**
 * Post reactions API functions
 */

// Available reaction types
export const REACTION_TYPES = {
  LIKE: '👍',
  LOVE: '❤️',
  LAUGH: '😂',
  WOW: '😮',
  SAD: '😢',
  ANGRY: '😡',
  CLAP: '👏',
  THINKING: '🤔',
  PARTY: '🎉',
  FIRE: '🔥',
  EYES: '👀',
  BOOK: '📚',
  STAR: '⭐',
  SPARKLE: '✨',
  HUNDRED: '💯',
  MIND_BLOWN: '🤯',
  HEART_EYES: '😍',
  THUMBS_DOWN: '👎',
};

export type ReactionType = keyof typeof REACTION_TYPES;

export interface Reaction {
  id: string;
  post_id: string;
  user_id: string;
  reaction_type: string;
  created_at: string;
}

/**
 * Add a reaction to a post
 * Each user can only have one reaction per post (regardless of type)
 */
export async function addReaction(userId: string, postId: string, reactionType: string) {
  if (!Object.values(REACTION_TYPES).includes(reactionType)) {
    throw new Error('Invalid reaction type');
  }

  try {
    // Check if user has any existing reactions on this post (regardless of type)
    const { data: allUserReactions, error: checkAllError } = await supabase
      .from('post_reactions')
      .select('id, reaction_type')
      .eq('user_id', userId)
      .eq('post_id', postId);

    if (checkAllError) {
      throw checkAllError;
    }

    // Find if the user has already reacted with this specific type
    const existingReactionOfSameType = allUserReactions?.find(r => r.reaction_type === reactionType);

    // If user has any reactions on this post
    if (allUserReactions && allUserReactions.length > 0) {
      // If user already reacted with this specific type, remove it (toggle behavior)
      if (existingReactionOfSameType) {
        const { error: deleteError } = await supabase
          .from('post_reactions')
          .delete()
          .eq('id', existingReactionOfSameType.id);

        if (deleteError) throw deleteError;
        return {
          success: true,
          added: false,
          removed: true,
          previousType: reactionType
        };
      }
      // If user reacted with a different type, remove the old reaction and add the new one
      else {
        // First, delete all existing reactions from this user on this post
        const { error: deleteError } = await supabase
          .from('post_reactions')
          .delete()
          .eq('user_id', userId)
          .eq('post_id', postId);

        if (deleteError) throw deleteError;

        // Then add the new reaction
        const { data, error } = await supabase
          .from('post_reactions')
          .insert([{ post_id: postId, user_id: userId, reaction_type: reactionType }])
          .select();

        if (error) throw error;
        return {
          success: true,
          added: true,
          replaced: true,
          previousType: allUserReactions[0].reaction_type,
          data: data && data.length > 0 ? data[0] : null
        };
      }
    }

    // If user has no reactions on this post yet, add the new reaction
    const { data, error } = await supabase
      .from('post_reactions')
      .insert([{ post_id: postId, user_id: userId, reaction_type: reactionType }])
      .select();

    if (error) throw error;
    return {
      success: true,
      added: true,
      data: data && data.length > 0 ? data[0] : null
    };
  } catch (error: any) {
    // If the table doesn't exist yet, throw a specific error
    if (error.message?.includes('relation "post_reactions" does not exist')) {
      console.error('post_reactions table does not exist yet. Migrations need to be run.');
      throw new Error('Reactions feature is not available yet. Please run database migrations.');
    }
    throw error;
  }
}

/**
 * Get all reactions for a post
 */
export async function getPostReactions(postId: string): Promise<Reaction[]> {
  try {
    const { data, error } = await supabase
      .from('post_reactions')
      .select('*')
      .eq('post_id', postId);

    if (error) throw error;
    return data as Reaction[] || [];
  } catch (error: any) {
    // If the table doesn't exist yet, return an empty array
    if (error.message?.includes('relation "post_reactions" does not exist')) {
      console.warn('post_reactions table does not exist yet. Migrations need to be run.');
      return [];
    }
    throw error;
  }
}

/**
 * Get reaction counts by type for a post
 */
export async function getReactionCounts(postId: string) {
  const reactions = await getPostReactions(postId);

  // Count reactions by type
  const counts: Record<string, number> = {};

  reactions.forEach(reaction => {
    if (!counts[reaction.reaction_type]) {
      counts[reaction.reaction_type] = 0;
    }
    counts[reaction.reaction_type]++;
  });

  return counts;
}

/**
 * Check if a user has reacted to a post with a specific reaction type
 */
export async function hasUserReacted(userId: string, postId: string, reactionType?: string) {
  try {
    let query = supabase
      .from('post_reactions')
      .select('reaction_type')
      .eq('user_id', userId)
      .eq('post_id', postId);

    if (reactionType) {
      query = query.eq('reaction_type', reactionType);
    }

    const { data, error } = await query;

    if (error) throw error;

    if (reactionType) {
      return data.length > 0;
    }

    // Return all reaction types the user has used
    return data.map(r => r.reaction_type);
  } catch (error: any) {
    // If the table doesn't exist yet, return empty results
    if (error.message?.includes('relation "post_reactions" does not exist')) {
      console.warn('post_reactions table does not exist yet. Migrations need to be run.');
      return reactionType ? false : [];
    }
    throw error;
  }
}
