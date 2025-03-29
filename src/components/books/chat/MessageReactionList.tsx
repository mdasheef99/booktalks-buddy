
import React from "react";
import { MessageReactionData } from "@/services/chat/models";
import { addReaction as addReactionService } from "@/services/chat/messageService";

interface MessageReactionListProps {
  reactions: Array<{
    reaction: string;
    count: number;
    userReacted: boolean;
    username: string;
  }>;
  messageId: string;
  currentUsername: string;
  isCurrentUser: boolean;
  onReactionsUpdated: (messageId: string) => void;
}

const MessageReactionList: React.FC<MessageReactionListProps> = ({
  reactions,
  messageId,
  currentUsername,
  isCurrentUser,
  onReactionsUpdated
}) => {
  const handleAddReaction = async (emoji: string) => {
    try {
      // Check if user already has a reaction
      const userExistingReaction = reactions.find(r => 
        r.username === currentUsername && r.userReacted
      );
      
      // If user already has a reaction that's the same as the new one, do nothing
      if (userExistingReaction && userExistingReaction.reaction === emoji) {
        return;
      }
      
      console.log("Adding reaction:", emoji, "to message:", messageId);
      
      // Add the new reaction (the API will handle replacing existing reactions)
      await addReactionService(messageId, emoji, currentUsername);
      
      // Refresh the reactions
      onReactionsUpdated(messageId);
    } catch (error) {
      console.error("Error adding reaction:", error);
    }
  };
  
  // Group reactions by emoji
  const groupedReactions = reactions.reduce((acc, reaction) => {
    // Skip reactions without emoji
    if (!reaction.reaction) return acc;
    
    if (!acc[reaction.reaction]) {
      acc[reaction.reaction] = {
        emoji: reaction.reaction,
        count: 0,
        userReacted: false,
        users: []
      };
    }
    
    acc[reaction.reaction].count++;
    
    if (reaction.username === currentUsername) {
      acc[reaction.reaction].userReacted = true;
    }
    
    if (!acc[reaction.reaction].users.includes(reaction.username)) {
      acc[reaction.reaction].users.push(reaction.username);
    }
    
    return acc;
  }, {} as Record<string, { emoji: string, count: number, userReacted: boolean, users: string[] }>);
  
  return (
    <div className="flex flex-wrap gap-1">
      {Object.values(groupedReactions).map((group) => (
        <button
          key={group.emoji}
          onClick={() => handleAddReaction(group.emoji)}
          className={`text-xs rounded-full px-2 py-0.5 flex items-center space-x-1 transition-all duration-200
            ${group.userReacted 
              ? 'bg-bookconnect-terracotta/20 border border-bookconnect-terracotta/30 shadow-sm' 
              : 'bg-white/80 hover:bg-bookconnect-terracotta/10 border border-gray-200'
            }`}
        >
          <span>{group.emoji}</span>
          <span className="text-xs">{group.count}</span>
        </button>
      ))}
    </div>
  );
};

export default MessageReactionList;
