
import React from "react";
import { ChatMessage } from "@/services/chatService";

interface ReplyPreviewProps {
  originalMessage: ChatMessage | undefined;
  isCurrentUser: boolean;
  onScrollToMessage: (messageId: string) => void;
}

const ReplyPreview: React.FC<ReplyPreviewProps> = ({ 
  originalMessage, 
  isCurrentUser,
  onScrollToMessage 
}) => {
  if (!originalMessage) return null;

  return (
    <div 
      className={`mb-2 rounded px-2 py-1 cursor-pointer ${
        isCurrentUser ? 'bg-white/10' : 'bg-bookconnect-brown/10'
      }`}
      onClick={() => onScrollToMessage(originalMessage.id)}
    >
      <div className={`text-xs font-medium ${
        isCurrentUser ? 'text-white/90' : 'text-bookconnect-brown/90'
      }`}>
        {originalMessage.username}
      </div>
      <div className={`text-xs italic truncate ${
        isCurrentUser ? 'text-white/70' : 'text-bookconnect-brown/70'
      }`}>
        {originalMessage.deleted_at 
          ? "Message deleted" 
          : originalMessage.message.length > 30
            ? `${originalMessage.message.substring(0, 30)}...`
            : originalMessage.message}
      </div>
    </div>
  );
};

export default ReplyPreview;
