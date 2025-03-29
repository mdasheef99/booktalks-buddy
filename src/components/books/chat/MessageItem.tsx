
import React from "react";
import { ChatMessage } from "@/services/chat/messageService";
import { Check } from "lucide-react";
import ReplyPreview from "./ReplyPreview";
import MessageActions from "./MessageActions";
import MessageReactionList from "./MessageReactionList";

interface MessageItemProps {
  message: ChatMessage;
  isCurrentUser: boolean;
  currentUsername: string;
  originalMessage?: ChatMessage;
  onReplyToMessage: (message: ChatMessage) => void;
  onScrollToMessage: (messageId: string) => void;
  isMobile: boolean;
  setRef: (el: HTMLDivElement | null) => void;
}

const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isCurrentUser,
  currentUsername,
  originalMessage,
  onReplyToMessage,
  onScrollToMessage,
  isMobile,
  setRef
}) => {
  const isDeleted = !!message.deleted_at;
  
  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  // Debug: Log reactions for this message
  if (message.reactions && message.reactions.length > 0) {
    console.log(`Message ${message.id} has ${message.reactions.length} reactions:`, message.reactions);
  }

  return (
    <div 
      className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-2`}
      ref={setRef}
    >
      <div className="flex flex-col max-w-[80%]">
        <div 
          className={`relative px-3 py-2 rounded-lg font-serif text-sm
            ${isCurrentUser 
              ? 'bg-bookconnect-sage/80 text-white rounded-tr-none' 
              : 'bg-bookconnect-terracotta/20 text-bookconnect-brown rounded-tl-none'
            } ${isDeleted ? 'opacity-70' : ''} transition-all duration-300 ease-in-out`}
        >
          <div className={`text-xs mb-1 ${isCurrentUser ? 'text-white/80' : 'text-bookconnect-brown/70'}`}>
            {message.username}
          </div>
          
          <ReplyPreview 
            originalMessage={originalMessage} 
            isCurrentUser={isCurrentUser}
            onScrollToMessage={onScrollToMessage}
          />
          
          <div style={{ wordBreak: "break-word" }}>
            {isDeleted ? (
              <span className="italic opacity-75">Message deleted</span>
            ) : (
              message.message
            )}
          </div>
          
          {!isDeleted && (
            <MessageActions 
              message={message}
              currentUsername={currentUsername}
              isCurrentUser={isCurrentUser}
              onReplyToMessage={onReplyToMessage}
              isMobile={isMobile}
            />
          )}
          
          <div className="flex justify-between items-center w-full mt-1">
            <span className="text-[10px] opacity-70 ml-auto flex items-center">
              {formatTime(message.timestamp)}
              {isCurrentUser && (
                <span className="flex ml-1">
                  <Check size={12} className="text-gray-400" />
                  <Check size={12} className="text-blue-400 -ml-[8px]" />
                </span>
              )}
            </span>
          </div>
        </div>
        
        {/* Place reactions outside and below the message bubble */}
        <div className={`w-full ${isCurrentUser ? 'self-end' : 'self-start'}`}>
          <MessageReactionList
            reactions={message.reactions}
            messageId={message.id}
            currentUsername={currentUsername}
            isCurrentUser={isCurrentUser}
          />
        </div>
      </div>
    </div>
  );
};

export default MessageItem;
