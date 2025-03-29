
import React, { useState, useEffect } from "react";
import { ChatMessage, getMessageReactions } from "@/services/chat/messageService";
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
  const [reactions, setReactions] = useState(message.reactions || []);
  
  useEffect(() => {
    setReactions(message.reactions || []);
  }, [message.reactions]);
  
  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  const handleReactionsUpdated = async (messageId: string) => {
    try {
      console.log("Refreshing reactions for message:", messageId);
      const updatedReactions = await getMessageReactions(messageId);
      console.log("Updated reactions:", updatedReactions);
      setReactions(updatedReactions);
    } catch (error) {
      console.error("Error refreshing reactions:", error);
    }
  };

  return (
    <div 
      className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-2`}
      ref={setRef}
    >
      <div className={`flex flex-col max-w-[75%] min-w-[150px]`}>
        <div 
          className={`relative px-2.5 py-1.5 rounded-2xl font-serif text-sm shadow-md
            ${isCurrentUser 
              ? 'bg-bookconnect-sage/95 text-white rounded-br-none' 
              : 'bg-bookconnect-terracotta/50 text-white rounded-bl-none'
            } ${isDeleted ? 'opacity-70' : ''} transition-all duration-300 ease-in-out`}
        >
          <div className={`text-xs mb-1 font-medium ${isCurrentUser ? 'text-white/90' : 'text-white/90'}`}>
            {message.username}
          </div>
          
          <ReplyPreview 
            originalMessage={originalMessage} 
            isCurrentUser={isCurrentUser}
            onScrollToMessage={onScrollToMessage}
          />
          
          <div className="whitespace-pre-wrap break-words">
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
              onReactionsUpdated={handleReactionsUpdated}
            />
          )}
          
          <div className="flex justify-between items-center w-full mt-1">
            <span className="text-[10px] opacity-80 ml-auto flex items-center">
              {formatTime(message.timestamp)}
              {isCurrentUser && (
                <span className="flex ml-1">
                  <Check size={10} className="text-white/80" />
                  <Check size={10} className="text-white -ml-[7px]" />
                </span>
              )}
            </span>
          </div>
        </div>
        
        {/* Place reactions outside and below the message bubble */}
        <div className={`w-full ${isCurrentUser ? 'self-end' : 'self-start'} mt-1`}>
          <MessageReactionList
            reactions={reactions}
            messageId={message.id}
            currentUsername={currentUsername}
            isCurrentUser={isCurrentUser}
            onReactionsUpdated={handleReactionsUpdated}
          />
        </div>
      </div>
    </div>
  );
};

export default MessageItem;
