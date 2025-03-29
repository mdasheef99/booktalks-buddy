
import React, { useRef, useState, useEffect } from "react";
import { ChatMessage } from "@/services/chatService";
import { useIsMobile } from "@/hooks/use-mobile";
import { TooltipProvider } from "@/components/ui/tooltip";
import MessageItem from "./chat/MessageItem";
import ScrollButtons from "./chat/ScrollButtons";
import { useScrollHandlers } from "@/hooks/use-scroll-handlers";

interface BookDiscussionChatProps {
  messages: ChatMessage[];
  loading: boolean;
  currentUsername: string;
  onReplyToMessage: (message: ChatMessage) => void;
}

const BookDiscussionChat: React.FC<BookDiscussionChatProps> = ({ 
  messages, 
  loading,
  currentUsername,
  onReplyToMessage
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Record<string, HTMLDivElement>>({});
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const isMobile = useIsMobile();
  
  const { 
    showScrollTop, 
    showScrollBottom, 
    scrollToTop, 
    scrollToBottom 
  } = useScrollHandlers(scrollContainerRef, messages);

  useEffect(() => {
    if (highlightedMessageId && messageRefs.current[highlightedMessageId]) {
      messageRefs.current[highlightedMessageId].scrollIntoView({ 
        behavior: 'smooth',
        block: 'center'
      });
      
      messageRefs.current[highlightedMessageId].classList.add('bg-amber-100/50');
      
      const timer = setTimeout(() => {
        if (messageRefs.current[highlightedMessageId]) {
          messageRefs.current[highlightedMessageId].classList.remove('bg-amber-100/50');
          setHighlightedMessageId(null);
        }
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [highlightedMessageId]);
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0 && scrollContainerRef.current) {
      scrollToBottom();
    }
  }, [messages.length]);
  
  const scrollToMessage = (messageId: string) => {
    setHighlightedMessageId(messageId);
  };
  
  const findOriginalMessage = (replyToId?: string): ChatMessage | undefined => {
    if (!replyToId) return undefined;
    return messages.find(message => message.id === replyToId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-bookconnect-terracotta mx-auto mb-3"></div>
          <p className="text-bookconnect-brown/80 font-serif">Loading conversation...</p>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-white/40 backdrop-blur-sm">
        <div className="text-center max-w-md px-8 py-12 rounded-xl bg-white/70 shadow-sm border border-bookconnect-brown/10">
          <h3 className="font-serif text-2xl font-medium mb-3 text-bookconnect-brown">Start the conversation</h3>
          <p className="text-bookconnect-brown/80 font-serif">
            Be the first to share your thoughts on this book. What did you enjoy most about it?
          </p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="relative h-full flex flex-col">
        <div 
          className="flex-1 overflow-auto p-5 scrollbar-thin scrollbar-thumb-bookconnect-brown/30 scrollbar-track-transparent" 
          ref={scrollContainerRef}
          style={{ scrollBehavior: 'smooth' }}
        >
          <div className="space-y-1">
            {messages.map((message) => {
              const isCurrentUser = message.username === currentUsername;
              const originalMessage = findOriginalMessage(message.reply_to_id);
              
              return (
                <MessageItem
                  key={`${message.id}-${message.timestamp}`}
                  message={message}
                  isCurrentUser={isCurrentUser}
                  currentUsername={currentUsername}
                  originalMessage={originalMessage}
                  onReplyToMessage={onReplyToMessage}
                  onScrollToMessage={scrollToMessage}
                  isMobile={isMobile}
                  setRef={el => {
                    if (el) {
                      messageRefs.current[message.id] = el;
                    }
                  }}
                />
              );
            })}
          </div>
        </div>
        
        <ScrollButtons
          showScrollTop={showScrollTop}
          showScrollBottom={showScrollBottom}
          onScrollTop={scrollToTop}
          onScrollBottom={scrollToBottom}
        />
      </div>
    </TooltipProvider>
  );
};

export default BookDiscussionChat;
