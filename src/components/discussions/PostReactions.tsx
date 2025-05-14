import React, { useState, useEffect } from 'react';
import { Smile, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  REACTION_TYPES,
  addReaction,
  getPostReactions,
  hasUserReacted
} from '@/lib/api/bookclubs/reactions';

interface PostReactionsProps {
  postId: string;
}

interface ReactionCount {
  type: string;
  count: number;
  userReacted: boolean;
}

const PostReactions: React.FC<PostReactionsProps> = ({ postId }) => {
  const { user } = useAuth();
  const [reactions, setReactions] = useState<ReactionCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingReaction, setAddingReaction] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);

  // Fetch reactions on mount and when they change
  useEffect(() => {
    fetchReactions();
  }, [postId]);

  const fetchReactions = async () => {
    if (!postId) return;

    try {
      setLoading(true);
      // Now getPostReactions returns the correct type
      const reactionData = await getPostReactions(postId);

      // Get user's reactions
      let userReactions: string[] = [];
      if (user) {
        try {
          userReactions = await hasUserReacted(user.id, postId) as string[];
        } catch (error) {
          console.error('Error fetching user reactions:', error);
          // Continue with empty user reactions
        }
      }

      // Count reactions by type
      const counts: Record<string, number> = {};
      reactionData.forEach(reaction => {
        if (!counts[reaction.reaction_type]) {
          counts[reaction.reaction_type] = 0;
        }
        counts[reaction.reaction_type]++;
      });

      // Convert to array for rendering
      const reactionCounts: ReactionCount[] = Object.entries(counts).map(([type, count]) => ({
        type,
        count,
        userReacted: userReactions.includes(type)
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
  };

  const handleReaction = async (reactionType: string) => {
    if (!user) {
      toast.error('Please log in to react to posts');
      return;
    }

    try {
      setAddingReaction(true);

      // We'll get the result from the API call directly

      // Call the API to toggle the reaction
      const result = await addReaction(user.id, postId, reactionType);

      // Refresh the reactions list
      await fetchReactions();

      // Close the popover if it's open
      setPopoverOpen(false);

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
    } catch (error: any) {
      console.error('Error toggling reaction:', error);

      // Check for specific error types
      if (error.message?.includes('relation "post_reactions" does not exist')) {
        toast.error('Reactions feature is not available yet. Please run database migrations.');
      } else if (error.code === 'PGRST116' || error.message?.includes('JSON object requested, multiple (or no) rows returned')) {
        // This is likely just a case where no rows were found, retry the operation
        console.log('No rows found, retrying operation...');
        await fetchReactions();
      } else if (error.status === 406 || error.message?.includes('Not Acceptable')) {
        toast.error('API format error. Please try again.');
      } else {
        toast.error('Failed to toggle reaction');
      }
    } finally {
      setAddingReaction(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center text-gray-400">
        <Loader2 className="h-4.5 w-4.5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {/* Display existing reactions */}
      {reactions.map(reaction => (
        <button
          key={reaction.type}
          onClick={() => handleReaction(reaction.type)}
          disabled={addingReaction}
          className={cn(
            "inline-flex items-center text-sm rounded-full px-2 py-1 transition-colors",
            reaction.userReacted
              ? "bg-bookconnect-sage/10 text-bookconnect-sage hover:bg-red-50 hover:text-red-500"
              : "text-gray-500 hover:bg-gray-100"
          )}
          title={reaction.userReacted
            ? `Click to remove your ${reaction.type} reaction`
            : `${reaction.count} ${reaction.type} reaction${reaction.count !== 1 ? 's' : ''}`}
        >
          <span>{reaction.type}</span>
          <span className="ml-1 text-xs">{reaction.count}</span>
          {reaction.userReacted && (
            <span className="ml-1 text-xs opacity-70">✓</span>
          )}
        </button>
      ))}

      {/* Add reaction button */}
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <button
            className="inline-flex items-center justify-center text-xs rounded-full p-1.5 text-gray-400 hover:bg-gray-100 transition-colors min-w-[28px] min-h-[28px]"
            disabled={addingReaction}
            title={reactions.some(r => r.userReacted)
              ? "Change your reaction (only one allowed per comment)"
              : "Add reaction (only one allowed per comment)"}
          >
            <Smile className="h-4.5 w-4.5" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="start">
          <div className="flex flex-col gap-2">
            <div className="text-xs text-gray-500 px-1">
              You can only add one reaction per comment
            </div>
            <div className="flex flex-wrap gap-1.5 max-w-[280px]">
              {Object.values(REACTION_TYPES).map(type => {
                // Check if user has already reacted with this emoji
                const hasReacted = reactions.some(r => r.type === type && r.userReacted);
                // Check if user has reacted with any emoji
                const hasAnyReaction = reactions.some(r => r.userReacted);
                // Get the current reaction type if any
                const currentReactionType = hasAnyReaction
                  ? reactions.find(r => r.userReacted)?.type
                  : null;

                return (
                  <button
                    key={type}
                    onClick={() => handleReaction(type)}
                    className={cn(
                      "text-xl p-1.5 rounded transition-colors",
                      hasReacted
                        ? "bg-bookconnect-sage/10 text-bookconnect-sage hover:bg-red-50 hover:text-red-500"
                        : hasAnyReaction && type !== currentReactionType
                          ? "hover:bg-gray-100 relative" // Different styling for when user has a different reaction
                          : "hover:bg-gray-100"
                    )}
                    disabled={addingReaction}
                    title={
                      hasReacted
                        ? `Remove ${type} reaction`
                        : hasAnyReaction && type !== currentReactionType
                          ? `Replace your ${currentReactionType} reaction with ${type}`
                          : `React with ${type}`
                    }
                  >
                    {type}
                    {hasAnyReaction && type !== currentReactionType && (
                      <span className="absolute -top-1 -right-1 text-[10px] text-gray-500">
                        ↺
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default PostReactions;
