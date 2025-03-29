
import React, { useRef, useState, useEffect } from "react";
import { ChatMessage } from "@/services/chatService";
import { useIsMobile } from "@/hooks/use-mobile";
import { TooltipProvider } from "@/components/ui/tooltip";
import MessageItem from "./chat/MessageItem";
import ScrollButtons from "./chat/ScrollButtons";

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
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const isMobile = useIsMobile();
  
  const messageRefs = useRef<Record<string, HTMLDivElement>>({});

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      setShowScrollTop(scrollTop > 20);
      setShowScrollBottom(scrollTop < scrollHeight - clientHeight - 20);
    };

    container.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => container.removeEventListener('scroll', handleScroll);
  }, [messages]);

  useEffect(() => {
    if (scrollContainerRef.current && !showScrollBottom) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages, showScrollBottom]);

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

  const scrollToTop = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ 
        top: scrollContainerRef.current.scrollHeight, 
        behavior: 'smooth' 
      });
    }
  };
  
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bookconnect-terracotta mx-auto mb-2"></div>
          <p className="text-bookconnect-brown/70 font-serif">Loading conversation...</p>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md">
          <h3 className="font-serif text-xl font-medium mb-2 text-bookconnect-brown">Start the conversation</h3>
          <p className="text-bookconnect-brown/70 font-serif">
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
          className="flex-1 overflow-auto p-4 scrollbar-thin scrollbar-thumb-bookconnect-brown/30 scrollbar-track-transparent" 
          ref={scrollContainerRef}
          style={{ scrollBehavior: 'smooth' }}
        >
          <div className="space-y-3">
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
