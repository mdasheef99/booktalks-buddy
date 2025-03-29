
import React, { useRef, useState, useEffect } from "react";
import { ChatMessage } from "@/services/chatService";
import { ArrowUp, ArrowDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

interface BookDiscussionChatProps {
  messages: ChatMessage[];
  loading: boolean;
  currentUsername: string;
}

const BookDiscussionChat: React.FC<BookDiscussionChatProps> = ({ 
  messages, 
  loading,
  currentUsername 
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const isMobile = useIsMobile();

  // Handle scroll position changes
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      // Show top arrow if not at the top
      setShowScrollTop(scrollTop > 20);
      // Show bottom arrow if not at the bottom
      setShowScrollBottom(scrollTop < scrollHeight - clientHeight - 20);
    };

    container.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check

    return () => container.removeEventListener('scroll', handleScroll);
  }, [messages]);

  // Scroll to the bottom when new messages arrive
  useEffect(() => {
    if (scrollContainerRef.current && !showScrollBottom) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages, showScrollBottom]);

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

  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="relative h-full flex flex-col">
      <div 
        className="flex-1 overflow-auto p-4 scrollbar-thin scrollbar-thumb-bookconnect-brown/30 scrollbar-track-transparent" 
        ref={scrollContainerRef}
        style={{ scrollBehavior: 'smooth' }}
      >
        <div className="space-y-3">
          {messages.map((message) => {
            const isCurrentUser = message.username === currentUsername;
            
            return (
              <div 
                key={`${message.id}-${message.timestamp}`}
                className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[80%] px-3 py-2 rounded-lg font-serif text-sm
                    ${isCurrentUser 
                      ? 'bg-bookconnect-sage/80 text-white rounded-tr-none' 
                      : 'bg-bookconnect-terracotta/20 text-bookconnect-brown rounded-tl-none'
                    }`}
                >
                  <div className={`text-xs mb-1 ${isCurrentUser ? 'text-white/80' : 'text-bookconnect-brown/70'}`}>
                    {message.username}
                  </div>
                  <div style={{ wordBreak: "break-word" }}>{message.message}</div>
                  <div className="flex justify-end items-center mt-1 space-x-1">
                    <span className="text-[10px] opacity-70">
                      {formatTime(message.timestamp)}
                    </span>
                    {isCurrentUser && (
                      <span className="flex">
                        <Check size={12} className="text-gray-400" />
                        <Check size={12} className="text-blue-400 -ml-[8px]" />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Scroll navigation buttons - centered and transparent */}
      <div className="absolute inset-y-0 right-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="flex flex-col gap-20 pointer-events-auto">
          {showScrollTop && (
            <Button 
              onClick={scrollToTop}
              size="sm"
              variant="secondary"
              className="bg-bookconnect-brown/30 hover:bg-bookconnect-brown/50 text-white rounded-full h-10 w-10 p-0 animate-fade-in shadow-md transition-all duration-300"
            >
              <ArrowUp size={18} />
              <span className="sr-only">Scroll to top</span>
            </Button>
          )}
          
          {showScrollBottom && (
            <Button 
              onClick={scrollToBottom}
              size="sm"
              variant="secondary"
              className="bg-bookconnect-brown/30 hover:bg-bookconnect-brown/50 text-white rounded-full h-10 w-10 p-0 animate-fade-in shadow-md transition-all duration-300"
            >
              <ArrowDown size={18} />
              <span className="sr-only">Scroll to bottom</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookDiscussionChat;
