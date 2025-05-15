import React, { useState, useEffect } from 'react';
import { Smile, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Import custom hooks
import { useReactions, ReactionCount } from '@/hooks/useReactions';
import { useReactionUsers } from '@/hooks/useReactionUsers';

// Import sub-components
import ReactionCounter from './reactions/ReactionCounter';
import ReactionUsersList from './reactions/ReactionUsersList';
import EmojiPicker from './reactions/EmojiPicker';

export interface PostReactionsProps {
  postId: string;
}

/**
 * Component to display and manage reactions for a post
 */
const PostReactions: React.FC<PostReactionsProps> = ({ postId }) => {
  const { user } = useAuth();
  const {
    reactions,
    loading,
    addingReaction,
    handleReaction,
    availableReactionTypes
  } = useReactions(postId);

  const {
    reactionUsers,
    loading: loadingUsers,
    fetchUsers,
    clearUsers
  } = useReactionUsers();

  // UI state
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [usersPopoverOpen, setUsersPopoverOpen] = useState(false);
  const [selectedReaction, setSelectedReaction] = useState<ReactionCount | null>(null);

  // Handle clicking on a reaction counter
  const handleReactionClick = async (reaction: ReactionCount) => {
    setSelectedReaction(reaction);
    await fetchUsers(reaction);
    setUsersPopoverOpen(true);
  };

  // Handle selecting an emoji from the picker
  const handleEmojiSelect = async (reactionType: string) => {
    if (!user) return;

    await handleReaction(user.id, reactionType);
    setEmojiPickerOpen(false);
  };

  // Handle removing a reaction
  const handleRemoveReaction = async (userId: string) => {
    if (!user || !selectedReaction) return;

    if (user.id === userId) {
      await handleReaction(userId, selectedReaction.type);
      setUsersPopoverOpen(false);
    }
  };

  // Close popovers when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isPopoverClick = target.closest('[data-radix-popper-content-wrapper]');

      if (!isPopoverClick) {
        setTimeout(() => {
          setUsersPopoverOpen(false);
        }, 100);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Clear users when popover closes
  useEffect(() => {
    if (!usersPopoverOpen) {
      setTimeout(() => {
        clearUsers();
        setSelectedReaction(null);
      }, 200);
    }
  }, [usersPopoverOpen, clearUsers]);

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
          open={usersPopoverOpen && selectedReaction?.type === reaction.type}
          onOpenChange={(open) => setUsersPopoverOpen(open)}
        >
          <PopoverTrigger asChild>
            <div>
              <ReactionCounter
                reaction={reaction}
                onClick={handleReactionClick}
                disabled={addingReaction}
              />
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3" align="start">
            <ReactionUsersList
              reactionType={reaction.type}
              reactionCount={reaction.count}
              users={reactionUsers}
              loading={loadingUsers}
              currentUserId={user?.id}
              onClose={() => setUsersPopoverOpen(false)}
              onRemoveReaction={handleRemoveReaction}
            />
          </PopoverContent>
        </Popover>
      ))}

      {/* Add reaction button */}
      <Popover open={emojiPickerOpen} onOpenChange={setEmojiPickerOpen}>
        <PopoverTrigger asChild>
          <button
            className="inline-flex items-center justify-center text-xs rounded-full p-1.5 text-gray-400 hover:bg-gray-100 transition-colors min-w-[28px] min-h-[28px]"
            disabled={addingReaction}
            title={reactions.some(r => r.userReacted)
              ? "Change your reaction (only one allowed per comment)"
              : "Add reaction (only one allowed per comment)"}
            aria-label="Add reaction"
          >
            <Smile className="h-4.5 w-4.5" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="start">
          <EmojiPicker
            availableReactions={availableReactionTypes}
            currentReactions={reactions}
            onSelect={handleEmojiSelect}
            disabled={addingReaction}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default PostReactions;