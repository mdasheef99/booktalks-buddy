
import React, { useState } from "react";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { Reply, Trash2, MoreHorizontal } from "lucide-react";
import { ChatMessage, deleteMessage } from "@/services/chat/messageService";
import { toast } from "sonner";
import MessageReaction from "./MessageReaction";

interface MessageActionsProps {
  message: ChatMessage;
  currentUsername: string;
  isCurrentUser: boolean;
  onReplyToMessage: (message: ChatMessage) => void;
  isMobile: boolean;
  onReactionsUpdated?: (messageId: string) => void;
}

const MessageActions: React.FC<MessageActionsProps> = ({
  message,
  currentUsername,
  isCurrentUser,
  onReplyToMessage,
  isMobile,
  onReactionsUpdated = () => {}
}) => {
  const [showActions, setShowActions] = useState(false);
  
  const handleReply = () => {
    onReplyToMessage(message);
  };
  
  const handleDelete = async () => {
    try {
      console.log("Deleting message:", message.id);
      const success = await deleteMessage(message.id);
      
      if (success) {
        console.log("Message deleted successfully");
        toast.success("Message deleted");
      }
    } catch (error) {
      console.error("Error deleting message:", error);
      toast.error("Failed to delete message");
    }
  };
  
  return (
    <div
      className={`absolute -bottom-7 ${isCurrentUser ? 'right-0' : 'left-0'} flex items-center gap-1`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Always show reaction button */}
      <MessageReaction 
        messageId={message.id} 
        currentUsername={currentUsername}
        onReactionsUpdated={onReactionsUpdated}
      />
      
      {/* Reply button */}
      <button
        className={`${
          showActions || isMobile ? 'opacity-100' : 'opacity-0'
        } flex items-center text-xs text-bookconnect-brown/50 hover:bg-bookconnect-terracotta/10 hover:text-bookconnect-brown px-1.5 py-0 rounded transition-opacity`}
        onClick={handleReply}
      >
        <Reply size={14} className="mr-1.5" />
        <span>Reply</span>
      </button>
      
      {/* Delete button (only for user's own messages) */}
      {isCurrentUser && (
        <HoverCard openDelay={300}>
          <HoverCardTrigger asChild>
            <button
              className={`${
                showActions || isMobile ? 'opacity-100' : 'opacity-0'
              } flex items-center text-xs text-bookconnect-brown/50 hover:bg-red-100 hover:text-red-500 px-1.5 py-0 rounded transition-opacity`}
              onClick={handleDelete}
            >
              <Trash2 size={14} className="mr-1.5" />
              <span>Delete</span>
            </button>
          </HoverCardTrigger>
          <HoverCardContent className="w-auto px-3 py-1.5">
            <p className="text-xs">This will delete the message for everyone</p>
          </HoverCardContent>
        </HoverCard>
      )}
    </div>
  );
};

export default MessageActions;
