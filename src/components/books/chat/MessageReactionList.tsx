
import React, { useState } from "react";
import { addReaction } from "@/services/chat/messageService";
import { ReactionData } from "./MessageReaction";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface MessageReactionListProps {
  reactions: ReactionData[] | undefined;
  messageId: string;
  currentUsername: string;
  isCurrentUser: boolean;
  onReactionsUpdated?: (messageId: string) => void;
}

const MessageReactionList: React.FC<MessageReactionListProps> = ({ 
  reactions, 
  messageId, 
  currentUsername,
  isCurrentUser,
  onReactionsUpdated = () => {}
}) => {
  const [selectedReaction, setSelectedReaction] = useState<string | null>(null);

  // If there are no reactions, don't render anything
  if (!reactions || reactions.length === 0) {
    console.log("No reactions for message:", messageId);
    return null;
  }

  console.log("Rendering reactions:", reactions);

  // Group reactions by emoji for the dialog display
  const reactionsByType = reactions.reduce<Record<string, string[]>>((acc, { reaction, username }) => {
    if (!acc[reaction]) {
      acc[reaction] = [];
    }
    acc[reaction].push(username);
    return acc;
  }, {});

  // Find if current user has already reacted with any emoji
  const userCurrentReaction = reactions.find(r => r.userReacted)?.reaction;

  const handleReactionClick = async (reaction: string) => {
    try {
      // If user clicked on same reaction they already added, it will toggle off
      // If different, it will replace their old reaction
      await addReaction(messageId, currentUsername, reaction);
      
      // Open dialog to show who reacted
      setSelectedReaction(reaction);
      
      // Notify parent about reaction update
      onReactionsUpdated(messageId);
    } catch (error) {
      console.error("Error handling reaction click:", error);
    }
  };

  return (
    <>
      <div className={`flex flex-wrap gap-1.5 mt-1 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
        {reactions.map(({ reaction, count, userReacted }) => (
          <button
            key={reaction}
            className={`px-2 py-0.5 rounded-full text-xs border flex items-center space-x-1 transition-colors ${
              userReacted 
                ? 'bg-bookconnect-terracotta/20 border-bookconnect-terracotta/30 shadow-sm' 
                : 'bg-bookconnect-brown/5 border-bookconnect-brown/10 hover:bg-bookconnect-terracotta/10'
            }`}
            onClick={() => handleReactionClick(reaction)}
            title={userReacted ? "Remove reaction" : "Add reaction"}
          >
            <span>{reaction}</span>
            <span className="ml-1 font-medium">{count}</span>
          </button>
        ))}
      </div>
      
      {/* Dialog to show who reacted with which emoji */}
      <Dialog open={selectedReaction !== null} onOpenChange={() => setSelectedReaction(null)}>
        <DialogContent className="max-w-sm rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-xl">{selectedReaction}</span>
              <span className="text-base font-normal">
                {selectedReaction && reactionsByType[selectedReaction]?.length} {' '}
                {selectedReaction && reactionsByType[selectedReaction]?.length === 1 ? 'reaction' : 'reactions'}
              </span>
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-60 overflow-y-auto">
            {selectedReaction && reactionsByType[selectedReaction]?.map((username, index) => (
              <div key={`${username}-${index}`} className="py-2 border-b border-gray-100 last:border-b-0">
                <p className="text-sm font-medium">{username}</p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MessageReactionList;
