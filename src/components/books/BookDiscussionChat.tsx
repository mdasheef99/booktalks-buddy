
import React, { useRef, useState, useEffect, useCallback, memo } from "react";
import { ChatMessage } from "@/services/chatService";
import { useIsMobile } from "@/hooks/use-mobile";
import { TooltipProvider } from "@/components/ui/tooltip";
import MessageItem from "./chat/MessageItem";
import MessageItemErrorBoundary from "./chat/MessageItemErrorBoundary";
import ScrollButtons from "./chat/ScrollButtons";
import { useScrollHandlers } from "@/hooks/use-scroll-handlers";

interface BookDiscussionChatProps {
  messages: ChatMessage[];
  loading: boolean;
  currentUsername: string;
  onReplyToMessage: (message: ChatMessage) => void;
  hasMoreMessages?: boolean;
  isLoadingOlderMessages?: boolean;
  onLoadOlderMessages?: () => Promise<void>;
}

const BookDiscussionChat: React.FC<BookDiscussionChatProps> = ({
  messages,
  loading,
  currentUsername,
  onReplyToMessage,
  hasMoreMessages = false,
  isLoadingOlderMessages = false,
  onLoadOlderMessages
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

  // Add scroll event listener to detect when to load older messages
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer || !hasMoreMessages || !onLoadOlderMessages) return;

    // Track the last scroll position to determine direction
    let lastScrollTop = scrollContainer.scrollTop;

    // Debounce function to prevent multiple rapid calls
    let isLoading = false;
    let timeoutId: NodeJS.Timeout | null = null;

    const handleScroll = () => {
      if (timeoutId) clearTimeout(timeoutId);

      timeoutId = setTimeout(() => {
        // Only trigger when scrolling up (towards older messages)
        const scrollTop = scrollContainer.scrollTop;
        const scrollingUp = scrollTop < lastScrollTop;
        lastScrollTop = scrollTop;

        // Check if we're near the top of the scroll container
        const isNearTop = scrollTop < 200;

        if (scrollingUp && isNearTop && hasMoreMessages && !isLoadingOlderMessages && !isLoading) {
          console.log("Near top of scroll container, loading older messages");
          isLoading = true;

          // Save current scroll height and position
          const scrollHeight = scrollContainer.scrollHeight;
          const scrollPosition = scrollContainer.scrollTop;

          // Load older messages
          onLoadOlderMessages().finally(() => {
            // After loading, restore relative scroll position
            setTimeout(() => {
              if (scrollContainer) {
                const newScrollHeight = scrollContainer.scrollHeight;
                const heightDifference = newScrollHeight - scrollHeight;
                scrollContainer.scrollTop = scrollPosition + heightDifference;
              }
              isLoading = false;
            }, 100);
          });
        }
      }, 200); // 200ms debounce
    };

    scrollContainer.addEventListener('scroll', handleScroll);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      scrollContainer.removeEventListener('scroll', handleScroll);
    };
  }, [hasMoreMessages, isLoadingOlderMessages, onLoadOlderMessages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0 && scrollContainerRef.current) {
      scrollToBottom();
    }
  }, [messages.length]);

  const scrollToMessage = useCallback((messageId: string) => {
    setHighlightedMessageId(messageId);
  }, []);

  const findOriginalMessage = useCallback((replyToId?: string): ChatMessage | undefined => {
    if (!replyToId) return undefined;
    return messages.find(message => message.id === replyToId);
  }, [messages]);

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
      <div className="relative h-full flex flex-col bg-white/10 backdrop-blur-sm">
        <div
          className="flex-1 overflow-auto p-5 scrollbar-thin scrollbar-thumb-bookconnect-brown/30 scrollbar-track-transparent"
          ref={scrollContainerRef}
          style={{ scrollBehavior: 'smooth' }}
        >
          <div className="space-y-1">
            {/* Loading indicator for older messages */}
            {isLoadingOlderMessages && (
              <div className="flex justify-center py-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-bookconnect-terracotta"></div>
              </div>
            )}

            {/* Message list */}
            {messages.map((message) => {
              const isCurrentUser = message.username === currentUsername;
              const originalMessage = findOriginalMessage(message.reply_to_id);

              return (
                <MessageItemErrorBoundary
                  key={`${message.id}-${message.timestamp}`}
                  messageId={message.id}
                >
                  <MessageItem
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
                </MessageItemErrorBoundary>
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

export default memo(BookDiscussionChat);
