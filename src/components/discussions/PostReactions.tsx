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
import { REACTION_TYPES, addReaction, getPostReactions, hasUserReacted } from '@/lib/api/bookclubs/reactions';

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
      await addReaction(user.id, postId, reactionType);
      await fetchReactions();
      setPopoverOpen(false);
    } catch (error: any) {
      console.error('Error adding reaction:', error);

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
        toast.error('Failed to add reaction');
      }
    } finally {
      setAddingReaction(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center text-gray-400">
        <Loader2 className="h-3 w-3 animate-spin" />
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
            "inline-flex items-center text-xs rounded-full px-1.5 py-0.5 transition-colors",
            reaction.userReacted
              ? "bg-bookconnect-sage/10 text-bookconnect-sage"
              : "text-gray-500 hover:bg-gray-100"
          )}
          title={`${reaction.count} ${reaction.type} reaction${reaction.count !== 1 ? 's' : ''}`}
        >
          <span>{reaction.type}</span>
          <span className="ml-0.5 text-[10px]">{reaction.count}</span>
        </button>
      ))}

      {/* Add reaction button */}
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <button
            className="inline-flex items-center text-xs rounded-full p-1 text-gray-400 hover:bg-gray-100 transition-colors"
            disabled={addingReaction}
            title="Add reaction"
          >
            <Smile className="h-3 w-3" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-1.5" align="start">
          <div className="flex gap-1">
            {Object.values(REACTION_TYPES).map(type => (
              <button
                key={type}
                onClick={() => handleReaction(type)}
                className="text-lg hover:bg-gray-100 p-1 rounded transition-colors"
                disabled={addingReaction}
                title={`React with ${type}`}
              >
                {type}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default PostReactions;
