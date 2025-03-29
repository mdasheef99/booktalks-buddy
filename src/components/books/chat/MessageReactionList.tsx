
import React from "react";
import { addReaction } from "@/services/chatService";
import { ReactionData } from "./MessageReaction";

interface MessageReactionListProps {
  reactions: ReactionData[] | undefined;
  messageId: string;
  currentUsername: string;
  isCurrentUser: boolean;
}

const MessageReactionList: React.FC<MessageReactionListProps> = ({ 
  reactions, 
  messageId, 
  currentUsername,
  isCurrentUser
}) => {
  if (!reactions || reactions.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-1 mt-1 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
      {reactions.map(({ reaction, count, userReacted }) => (
        <button
          key={reaction}
          className={`px-1.5 py-0.5 rounded-full text-xs border flex items-center space-x-1 transition-colors ${
            userReacted 
              ? 'bg-bookconnect-terracotta/20 border-bookconnect-terracotta/30' 
              : 'bg-bookconnect-brown/5 border-bookconnect-brown/10 hover:bg-bookconnect-terracotta/10'
          }`}
          onClick={() => addReaction(messageId, currentUsername, reaction)}
        >
          <span>{reaction}</span>
          <span>{count}</span>
        </button>
      ))}
    </div>
  );
};

export default MessageReactionList;
