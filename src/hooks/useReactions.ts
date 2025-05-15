import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  REACTION_TYPES,
  addReaction,
  getPostReactions,
  hasUserReacted,
  Reaction
} from '@/lib/api/bookclubs/reactions';

export interface ReactionCount {
  type: string;
  count: number;
  userReacted: boolean;
  userIds: string[]; // Array of user IDs who reacted with this emoji
}

export interface ReactionResult {
  success: boolean;
  added?: boolean;
  removed?: boolean;
  replaced?: boolean;
  previousType?: string;
  data?: any;
}

export interface UseReactionsReturn {
  reactions: ReactionCount[];
  loading: boolean;
  addingReaction: boolean;
  handleReaction: (userId: string, reactionType: string) => Promise<ReactionResult | undefined>;
  refreshReactions: () => Promise<void>;
  availableReactionTypes: typeof REACTION_TYPES;
}

/**
 * Custom hook to manage reactions for a post
 * @param postId The ID of the post to manage reactions for
 */
export function useReactions(postId: string): UseReactionsReturn {
  const [reactions, setReactions] = useState<ReactionCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingReaction, setAddingReaction] = useState(false);

  /**
   * Fetch reactions for the post
   */
  const fetchReactions = useCallback(async (userId?: string) => {
    if (!postId) return;

    try {
      setLoading(true);
      // Get all reactions for this post
      const reactionData = await getPostReactions(postId);

      // Get user's reactions if userId is provided
      let userReactions: string[] = [];
      if (userId) {
        try {
          userReactions = await hasUserReacted(userId, postId) as string[];
        } catch (error) {
          console.error('Error fetching user reactions:', error);
          // Continue with empty user reactions
        }
      }

      // Group reactions by type and collect user IDs
      const reactionsByType: Record<string, string[]> = {};

      reactionData.forEach(reaction => {
        if (!reactionsByType[reaction.reaction_type]) {
          reactionsByType[reaction.reaction_type] = [];
        }
        reactionsByType[reaction.reaction_type].push(reaction.user_id);
      });

      // Convert to array for rendering
      const reactionCounts: ReactionCount[] = Object.entries(reactionsByType).map(([type, userIds]) => ({
        type,
        count: userIds.length,
        userReacted: userReactions.includes(type),
        userIds
      }));

      // Sort by count (descending)
      reactionCounts.sort((a, b) => b.count - a.count);

      setReactions(reactionCounts);
    } catch (error) {
      console.error('Error fetching reactions:', error);
      // If there's an error (like table doesn't exist), just show empty reactions
      setReactions([]);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  /**
   * Handle adding or removing a reaction
   */
  const handleReaction = useCallback(async (userId: string, reactionType: string): Promise<ReactionResult | undefined> => {
    if (!userId) {
      toast.error('Please log in to react to posts');
      return;
    }

    try {
      setAddingReaction(true);

      // Call the API to toggle the reaction
      const result = await addReaction(userId, postId, reactionType);

      // Refresh the reactions list
      await fetchReactions(userId);

      // Show appropriate toast message based on the action taken
      if (result.removed) {
        // If the user's reaction was removed (toggle off)
        toast.success(`Removed ${reactionType} reaction`);
      } else if (result.replaced) {
        // If the user's previous reaction was replaced with a new one
        toast.success(`Changed reaction from ${result.previousType} to ${reactionType}`);
      } else if (result.added) {
        // If a new reaction was added
        toast.success(`Added ${reactionType} reaction`);
      }

      return result;
    } catch (error: any) {
      console.error('Error toggling reaction:', error);

      // Check for specific error types
      if (error.message?.includes('relation "post_reactions" does not exist')) {
        toast.error('Reactions feature is not available yet. Please run database migrations.');
      } else if (error.code === 'PGRST116' || error.message?.includes('JSON object requested, multiple (or no) rows returned')) {
        // This is likely just a case where no rows were found, retry the operation
        console.log('No rows found, retrying operation...');
        await fetchReactions(userId);
      } else if (error.status === 406 || error.message?.includes('Not Acceptable')) {
        toast.error('API format error. Please try again.');
      } else {
        toast.error('Failed to toggle reaction');
      }
      return undefined;
    } finally {
      setAddingReaction(false);
    }
  }, [postId, fetchReactions]);

  // Fetch reactions on mount
  useEffect(() => {
    fetchReactions();
  }, [fetchReactions]);

  return {
    reactions,
    loading,
    addingReaction,
    handleReaction,
    refreshReactions: fetchReactions,
    availableReactionTypes: REACTION_TYPES
  };
}
