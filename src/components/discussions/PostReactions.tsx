import React, { useState, useEffect } from 'react';
import { Smile, Loader2, X } from 'lucide-react';
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
import { getUserProfiles, UserProfile } from '@/services/profileService';
import UserName from '@/components/common/UserName';

interface PostReactionsProps {
  postId: string;
}

interface ReactionCount {
  type: string;
  count: number;
  userReacted: boolean;
  userIds: string[]; // Array of user IDs who reacted with this emoji
}

interface ReactionUser {
  userId: string;
  profile: UserProfile | null;
}

const PostReactions: React.FC<PostReactionsProps> = ({ postId }) => {
  const { user } = useAuth();
  const [reactions, setReactions] = useState<ReactionCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingReaction, setAddingReaction] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [selectedReaction, setSelectedReaction] = useState<string | null>(null);
  const [reactionUsers, setReactionUsers] = useState<ReactionUser[]>([]);
  const [usersPopoverOpen, setUsersPopoverOpen] = useState(false);

  // Fetch reactions on mount and when they change
  useEffect(() => {
    fetchReactions();
  }, [postId]);

  // Add event listener to close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (usersPopoverOpen) {
        setUsersPopoverOpen(false);
      }
    };

    // Add a slight delay to avoid immediate closing when opening the popover
    const handleDocumentClick = (e: MouseEvent) => {
      // Check if the click is on a popover or its children
      const target = e.target as HTMLElement;
      const isPopoverClick = target.closest('[data-radix-popper-content-wrapper]');

      if (!isPopoverClick) {
        setTimeout(handleClickOutside, 100);
      }
    };

    document.addEventListener('mousedown', handleDocumentClick);

    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
    };
  }, [usersPopoverOpen]);

  const fetchReactions = async () => {
    if (!postId) return;

    try {
      setLoading(true);
      // Get all reactions for this post
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
  };

  // Function to fetch user profiles for a specific reaction type
  const fetchReactionUsers = async (reactionType: string) => {
    // Reset users list while loading
    setReactionUsers([]);

    const reaction = reactions.find(r => r.type === reactionType);
    if (!reaction) {
      console.error(`Reaction type ${reactionType} not found`);
      return;
    }

    try {
      console.log(`Fetching profiles for reaction ${reactionType} with ${reaction.userIds.length} users`);

      // Get user profiles for all users who reacted with this emoji
      const userProfiles = await getUserProfiles(reaction.userIds);

      // Convert to array of ReactionUser objects
      const users: ReactionUser[] = reaction.userIds.map(userId => ({
        userId,
        profile: userProfiles.get(userId) || null
      }));

      // Log the current user's ID for debugging
      if (user) {
        console.log(`Current user ID: ${user.id}`);
        console.log(`User IDs in reaction: ${reaction.userIds.join(', ')}`);
        console.log(`Is current user in reaction: ${reaction.userIds.includes(user.id)}`);
      }

      setReactionUsers(users);
      setSelectedReaction(reactionType);
      setUsersPopoverOpen(true);
    } catch (error) {
      console.error('Error fetching reaction users:', error);
      toast.error('Failed to load user information');
    }
  };

  // Function to handle removing a reaction when clicking on username in popover
  const handleRemoveUserReaction = async (userId: string) => {
    // Double-check that this is the current user and we have a selected reaction
    if (!user || user.id !== userId || !selectedReaction) {
      console.error('Cannot remove reaction: invalid user or reaction');
      return;
    }

    try {
      setAddingReaction(true);
      console.log(`Removing reaction ${selectedReaction} for user ${userId}`);

      // Call the API to remove the reaction
      const result = await addReaction(userId, postId, selectedReaction);

      if (result.removed) {
        // Refresh the reactions list
        await fetchReactions();

        // Close the users popover
        setUsersPopoverOpen(false);

        toast.success(`Removed ${selectedReaction} reaction`);
      } else {
        console.error('Reaction was not removed as expected', result);
        toast.error('Something went wrong. Please try again.');
      }
    } catch (error: any) {
      console.error('Error removing reaction:', error);
      toast.error('Failed to remove reaction');
    } finally {
      setAddingReaction(false);
    }
  };

  const handleReaction = async (reactionType: string) => {
    if (!user) {
      toast.error('Please log in to react to posts');
      return;
    }

    try {
      setAddingReaction(true);

      // Call the API to toggle the reaction
      const result = await addReaction(user.id, postId, reactionType);

      // Refresh the reactions list
      await fetchReactions();

      // Close the popover if it's open
      setPopoverOpen(false);

      // Also close the users popover if it's open
      if (usersPopoverOpen) {
        setUsersPopoverOpen(false);
      }

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
        <Popover
          key={reaction.type}
          open={usersPopoverOpen && selectedReaction === reaction.type}
          onOpenChange={(open) => {
            if (open) {
              fetchReactionUsers(reaction.type);
            } else {
              setUsersPopoverOpen(false);
            }
          }}
        >
          <PopoverTrigger asChild>
            <button
              onClick={(e) => {
                e.stopPropagation();
                // Always just show the users popover, don't toggle reaction
                fetchReactionUsers(reaction.type);
              }}
              disabled={addingReaction}
              className={cn(
                "inline-flex items-center text-sm rounded-full px-2 py-1 transition-colors",
                reaction.userReacted
                  ? "bg-bookconnect-sage/10 text-bookconnect-sage hover:bg-red-50 hover:text-red-500"
                  : "text-gray-500 hover:bg-gray-100"
              )}
              title={`Click to see who reacted with ${reaction.type}`}
            >
              <span>{reaction.type}</span>
              <span className="ml-1 text-xs">{reaction.count}</span>
              {reaction.userReacted && (
                <span className="ml-1 text-xs opacity-70">✓</span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3" align="start">
            <div className="flex flex-col gap-2 min-w-[180px]">
              <div className="flex items-center justify-between border-b pb-1 mb-1">
                <h4 className="text-sm font-medium flex items-center">
                  <span className="mr-2">{reaction.type}</span>
                  <span className="text-gray-500 text-xs">
                    {reaction.count} {reaction.count === 1 ? 'person' : 'people'}
                  </span>
                </h4>
                <button
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-full"
                  onClick={() => setUsersPopoverOpen(false)}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="max-h-[200px] overflow-y-auto">
                {reactionUsers.length > 0 ? (
                  reactionUsers.map(reactionUser => {
                    // Explicitly check if this is the current user's reaction
                    const isCurrentUser = user && user.id === reactionUser.userId;

                    return (
                      <div
                        key={reactionUser.userId}
                        className={cn(
                          "flex items-center py-1.5 px-1 rounded hover:bg-gray-50",
                          isCurrentUser && "cursor-pointer hover:bg-red-50 border border-bookconnect-terracotta/20"
                        )}
                        onClick={() => {
                          if (isCurrentUser) {
                            handleRemoveUserReaction(reactionUser.userId);
                          }
                        }}
                      >
                        <div className="flex items-center">
                          <UserName
                            userId={reactionUser.userId}
                            linkToProfile={!isCurrentUser}
                            className={cn(
                              "text-sm",
                              isCurrentUser && "font-medium text-bookconnect-terracotta hover:text-red-500"
                            )}
                          />
                          {isCurrentUser && (
                            <span className="ml-1 text-xs bg-bookconnect-terracotta/10 text-bookconnect-terracotta px-1 py-0.5 rounded">You</span>
                          )}
                        </div>
                        {isCurrentUser && (
                          <span className="ml-auto text-xs text-red-400 hover:text-red-500">Remove</span>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="py-2 text-center text-gray-500 text-sm">
                    <Loader2 className="h-4 w-4 animate-spin mx-auto mb-1" />
                    Loading users...
                  </div>
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>
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
