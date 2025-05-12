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
 */
export async function addReaction(userId: string, postId: string, reactionType: string) {
  if (!Object.values(REACTION_TYPES).includes(reactionType)) {
    throw new Error('Invalid reaction type');
  }

  try {
    // Check if user has already reacted with this type
    const { data: existingReactions, error: checkError } = await supabase
      .from('post_reactions')
      .select('id')
      .eq('user_id', userId)
      .eq('post_id', postId)
      .eq('reaction_type', reactionType);

    if (checkError) {
      throw checkError;
    }

    // Get the first reaction if any exist
    const existingReaction = existingReactions && existingReactions.length > 0 ? existingReactions[0] : null;

    // If user already reacted with this type, remove it (toggle behavior)
    if (existingReaction) {
      const { error: deleteError } = await supabase
        .from('post_reactions')
        .delete()
        .eq('id', existingReaction.id);

      if (deleteError) throw deleteError;
      return { success: true, added: false };
    }

    // Add the reaction
    const { data, error } = await supabase
      .from('post_reactions')
      .insert([{ post_id: postId, user_id: userId, reaction_type: reactionType }])
      .select();

    if (error) throw error;
    return { success: true, added: true, data: data && data.length > 0 ? data[0] : null };
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
export async function getPostReactions(postId: string) {
  try {
    const { data, error } = await supabase
      .from('post_reactions')
      .select('*')
      .eq('post_id', postId);

    if (error) throw error;
    return data || [];
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
