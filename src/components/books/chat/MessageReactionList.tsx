
import React, { useState } from "react";
import { MessageReactionData } from "@/services/chat/models";
import { addReaction as addReactionService } from "@/services/chat/messageService";
import UserReactionList from "./UserReactionList";

interface MessageReactionListProps {
  reactions: Array<{
    reaction: string;
    count: number;
    userReacted: boolean;
    username: string;
    users?: string[]; // Array of all users who reacted with this emoji
  }>;
  messageId: string;
  currentUsername: string;
  isCurrentUser: boolean;
  onReactionsUpdated: (messageId: string) => void;
  isDeleted?: boolean; // Flag to indicate if the message is deleted
}

const MessageReactionList: React.FC<MessageReactionListProps> = ({
  reactions,
  messageId,
  currentUsername,
  isCurrentUser,
  onReactionsUpdated,
  isDeleted = false
}) => {
  // Debug log to see what reactions data we're receiving
  console.log("MessageReactionList - reactions:", reactions);
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [userListOpen, setUserListOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  // Add error handling for anonymous chat
  if (!messageId || !currentUsername) {
    console.warn('MessageReactionList: Missing required props', { messageId, currentUsername });
    return null;
  }

  // Ensure reactions is always an array
  const safeReactions = Array.isArray(reactions) ? reactions : [];

  const handleAddReaction = async (emoji: string, event?: React.MouseEvent) => {
    // This function now only handles adding/removing reactions
    // If event is provided and it's a special click, show user list instead
    if (event && (event.ctrlKey || event.metaKey || event.button === 2)) {
      event.preventDefault();
      event.stopPropagation();
      showUserList(emoji);
      return;
    }

    try {
      // Check if user already has this exact reaction
      const userHasThisReaction = reactions.some(r =>
        r.username === currentUsername && r.reaction === emoji && r.userReacted
      );

      console.log("Adding/toggling reaction:", emoji, "to message:", messageId);
      console.log("User already has this reaction:", userHasThisReaction);

      // The backend will handle toggling and ensuring only one reaction per user
      const success = await addReactionService(messageId, currentUsername, emoji);

      if (success) {
        console.log("Reaction operation successful, refreshing reactions");

        // Refresh the reactions immediately
        onReactionsUpdated(messageId);

        // Also set a timeout to refresh again after a short delay
        // This helps ensure we get the latest data after the database has updated
        setTimeout(() => {
          console.log("Delayed reaction refresh");
          onReactionsUpdated(messageId);
        }, 500);
      } else {
        console.error("Reaction operation failed");
      }
    } catch (error) {
      console.error("Error adding/toggling reaction:", error);
    }
  };

  const showUserList = (emoji: string) => {
    console.log("showUserList called for emoji:", emoji);

    // First check if the reaction data already includes the users array
    const reactionWithUsers = reactions.find(r => r.reaction === emoji && r.users && r.users.length > 0);
    console.log("Found reaction with users:", reactionWithUsers);

    if (reactionWithUsers && reactionWithUsers.users) {
      console.log("Using users from reaction data:", reactionWithUsers.users);
      setSelectedEmoji(emoji);
      setSelectedUsers(reactionWithUsers.users);
      setUserListOpen(true);
      return;
    }

    // Fallback to grouped reactions if needed
    const group = groupedReactions[emoji];
    console.log("Using grouped reactions:", group);

    if (group && group.users && group.users.length > 0) {
      console.log("Using users from grouped reactions:", group.users);
      setSelectedEmoji(emoji);
      setSelectedUsers(group.users);
      setUserListOpen(true);
    } else {
      console.log("No users found for this emoji");

      // If we have raw reaction data, use that as a last resort
      const rawUsers = reactions
        .filter(r => r.reaction === emoji)
        .map(r => r.username);

      if (rawUsers.length > 0) {
        console.log("Using raw username data:", rawUsers);
        setSelectedEmoji(emoji);
        setSelectedUsers(rawUsers);
        setUserListOpen(true);
      }
    }
  };

  console.log("Processing reactions in MessageReactionList:", safeReactions);

  // Group reactions by emoji
  const groupedReactions = safeReactions.reduce((acc, reaction) => {
    // Skip reactions without emoji
    if (!reaction.reaction) return acc;

    if (!acc[reaction.reaction]) {
      acc[reaction.reaction] = {
        emoji: reaction.reaction,
        count: 0,
        userReacted: false,
        users: reaction.users || []
      };
    }

    // If the reaction already has users array from the backend, use that
    if (reaction.users && reaction.users.length > 0) {
      acc[reaction.reaction].users = reaction.users;
      // Set userReacted based on whether the current user is in the users array
      acc[reaction.reaction].userReacted = reaction.users.includes(currentUsername);
    } else {
      // Otherwise, increment count and add users manually
      acc[reaction.reaction].count++;

      if (reaction.username === currentUsername) {
        acc[reaction.reaction].userReacted = true;
      }

      if (!acc[reaction.reaction].users.includes(reaction.username)) {
        acc[reaction.reaction].users.push(reaction.username);
      }
    }

    return acc;
  }, {} as Record<string, { emoji: string, count: number, userReacted: boolean, users: string[] }>);

  console.log("Grouped reactions:", groupedReactions);

  // If the message is deleted, only show existing reactions in read-only mode
  if (isDeleted) {
    return (
      <>
        <div className="flex flex-wrap gap-1">
          {/* Render only the emojis that users have reacted with in read-only mode */}
          {Object.values(groupedReactions).map((group) => (
            <div
              key={group.emoji}
              className="rounded-full px-2 py-1 flex items-center space-x-1 bg-gray-100 border border-gray-200 opacity-70"
              title={`${group.users ? group.users.length : group.count} ${(group.users ? group.users.length : group.count) === 1 ? 'person' : 'people'} reacted with ${group.emoji}`}
            >
              <span className="text-base">{group.emoji}</span>
              <span className="text-xs font-bold">{group.users ? group.users.length : group.count}</span>
            </div>
          ))}
        </div>
      </>
    );
  }

  // Normal mode for non-deleted messages
  return (
    <>
      <div className="flex flex-wrap gap-1">
        {/* Render only the emojis that users have reacted with */}
        {Object.values(groupedReactions).map((group) => (
          <button
            key={group.emoji}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // Show user list when clicking on the emoji
              showUserList(group.emoji);
            }}
            className={`rounded-full px-2 py-1 flex items-center space-x-1 transition-all duration-200
              ${group.userReacted
                ? 'bg-bookconnect-terracotta/20 border border-bookconnect-terracotta/30 shadow-sm'
                : 'bg-white/80 hover:bg-bookconnect-terracotta/10 border border-gray-200'
              }`}
            title={`${group.users ? group.users.length : group.count} ${(group.users ? group.users.length : group.count) === 1 ? 'person' : 'people'} reacted with ${group.emoji}. Click to see who reacted.`}
          >
            <span className="text-base">{group.emoji}</span>
            <span className="text-xs font-bold">{group.users ? group.users.length : group.count}</span>
          </button>
        ))}
      </div>

      {selectedEmoji && (
        <UserReactionList
          emoji={selectedEmoji}
          users={selectedUsers}
          isOpen={userListOpen}
          onClose={() => setUserListOpen(false)}
          currentUsername={currentUsername}
          onRemoveReaction={() => {
            // Remove the user's reaction
            handleAddReaction(selectedEmoji);
            setUserListOpen(false);
          }}
        />
      )}
    </>
  );
};

export default MessageReactionList;
