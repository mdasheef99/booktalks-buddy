import React, { useState, useEffect, useCallback, memo } from "react";
import { ChatMessage, getMessageReactions, subscribeToReactions } from "@/services/chat/messageService";
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

    // Set up a subscription to reaction changes for this message
    const subscription = subscribeToReactions(message.id, () => {
      // When reactions change, fetch the latest reactions
      console.log("Reaction change detected via subscription, updating...");
      handleReactionsUpdated(message.id);
    });

    // Fetch reactions immediately to ensure we have the latest data
    handleReactionsUpdated(message.id);

    // Clean up subscription when component unmounts or message changes
    return () => {
      subscription.unsubscribe();
    };
  }, [message.id]);

  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  const handleReactionsUpdated = useCallback(async (messageId: string) => {
    try {
      console.log("Refreshing reactions for message:", messageId);
      const updatedReactions = await getMessageReactions(messageId);
      console.log("Updated reactions:", updatedReactions);
      setReactions(updatedReactions);
    } catch (error) {
      console.error("Error refreshing reactions:", error);
    }
  }, []);

  return (
    <div
      className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-2`}
      ref={setRef}
    >
      <div className={`flex flex-col max-w-[75%] min-w-[150px] w-[300px]`}>
        <div
          className={`relative px-3.5 py-2 rounded-2xl font-serif text-sm shadow-md
            ${isCurrentUser
              ? 'bg-gradient-to-br from-bookconnect-sage/95 to-bookconnect-sage/85 text-white rounded-br-none border border-bookconnect-sage/20'
              : 'bg-gradient-to-br from-bookconnect-terracotta/60 to-bookconnect-terracotta/50 text-white rounded-bl-none border border-bookconnect-terracotta/20'
            } ${isDeleted ? 'opacity-70' : ''} transition-all duration-300 ease-in-out backdrop-blur-sm`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs font-medium ${isCurrentUser ? 'text-white/90' : 'text-white/90'}`}>
              {message.username}
            </span>
            <MessageActions
              message={message}
              currentUsername={currentUsername}
              isCurrentUser={isCurrentUser}
              onReplyToMessage={onReplyToMessage}
              isMobile={isMobile}
              onReactionsUpdated={handleReactionsUpdated}
            />
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

          <div className="flex justify-between items-center w-full mt-1.5">
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

        <div className={`w-full ${isCurrentUser ? 'self-end' : 'self-start'} mt-1`}>
          <MessageReactionList
            reactions={reactions}
            messageId={message.id}
            currentUsername={currentUsername}
            isCurrentUser={isCurrentUser}
            onReactionsUpdated={handleReactionsUpdated}
            isDeleted={isDeleted}
          />
        </div>
      </div>
    </div>
  );
};

export default memo(MessageItem);
