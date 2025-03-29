
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
}

const MessageReactionList: React.FC<MessageReactionListProps> = ({ 
  reactions, 
  messageId, 
  currentUsername,
  isCurrentUser
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

  return (
    <>
      <div className={`flex flex-wrap gap-1 mt-1 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
        {reactions.map(({ reaction, count, userReacted }) => (
          <button
            key={reaction}
            className={`px-1.5 py-0.5 rounded-full text-xs border flex items-center space-x-1 transition-colors ${
              userReacted 
                ? 'bg-bookconnect-terracotta/20 border-bookconnect-terracotta/30' 
                : 'bg-bookconnect-brown/5 border-bookconnect-brown/10 hover:bg-bookconnect-terracotta/10'
            }`}
            onClick={() => {
              // Add reaction on click
              addReaction(messageId, currentUsername, reaction);
              // Open dialog to show who reacted
              setSelectedReaction(reaction);
            }}
          >
            <span>{reaction}</span>
            <span className="ml-1">{count}</span>
          </button>
        ))}
      </div>
      
      {/* Dialog to show who reacted with which emoji */}
      <Dialog open={selectedReaction !== null} onOpenChange={() => setSelectedReaction(null)}>
        <DialogContent className="max-w-sm">
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
