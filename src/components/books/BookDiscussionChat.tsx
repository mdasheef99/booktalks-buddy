import React, { useRef, useState, useEffect } from "react";
import { ChatMessage, deleteMessage, addReaction, getMessageReactions, subscribeToReactions } from "@/services/chatService";
import { ArrowUp, ArrowDown, Check, MoreVertical, Reply, Trash2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import * as Sentry from "@sentry/react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface BookDiscussionChatProps {
  messages: ChatMessage[];
  loading: boolean;
  currentUsername: string;
  onReplyToMessage: (message: ChatMessage) => void;
}

interface MessageReaction {
  reaction: string;
  count: number;
  userReacted: boolean;
  username: string;
}

const MessageReactions = ({ 
  messageId, 
  currentUsername 
}: { 
  messageId: string; 
  currentUsername: string;
}) => {
  const [reactions, setReactions] = useState<MessageReaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  const availableReactions = ["👍", "👎", "❤️", "😂", "😮", "🎉", "📚"];
  
  useEffect(() => {
    const loadReactions = async () => {
      setIsLoading(true);
      try {
        const data = await getMessageReactions(messageId);
        setReactions(data);
      } catch (error) {
        console.error("Error loading reactions:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadReactions();
    
    const subscription = subscribeToReactions(messageId, () => {
      loadReactions();
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, [messageId]);
  
  const handleReact = async (emoji: string) => {
    try {
      await addReaction(messageId, currentUsername, emoji);
      setIsOpen(false);
    } catch (error) {
      console.error("Error adding reaction:", error);
      toast.error("Failed to react to message");
    }
  };
  
  if (reactions.length === 0 && !isOpen) {
    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 px-1.5 text-xs text-bookconnect-brown/50 hover:bg-bookconnect-terracotta/10 hover:text-bookconnect-brown"
          >
            React
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="start">
          <div className="flex space-x-1">
            {availableReactions.map(emoji => (
              <button 
                key={emoji}
                className="text-lg p-1 hover:bg-bookconnect-terracotta/10 rounded-full transition-transform hover:scale-110"
                onClick={() => handleReact(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    );
  }
  
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 px-1.5 text-xs text-bookconnect-brown/50 hover:bg-bookconnect-terracotta/10 hover:text-bookconnect-brown"
          >
            React
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="start">
          <div className="flex space-x-1">
            {availableReactions.map(emoji => (
              <button 
                key={emoji}
                className="text-lg p-1 hover:bg-bookconnect-terracotta/10 rounded-full transition-transform hover:scale-110"
                onClick={() => handleReact(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
      
      {reactions.map(({ reaction, count, userReacted }) => (
        <button
          key={reaction}
          className={`px-1.5 py-0.5 rounded-full text-xs border flex items-center space-x-1 transition-colors ${
            userReacted 
              ? 'bg-bookconnect-terracotta/20 border-bookconnect-terracotta/30' 
              : 'bg-bookconnect-brown/5 border-bookconnect-brown/10 hover:bg-bookconnect-terracotta/10'
          }`}
          onClick={() => handleReact(reaction)}
        >
          <span>{reaction}</span>
          <span>{count}</span>
        </button>
      ))}
    </div>
  );
};

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
  
  const handleDeleteMessage = async (messageId: string, forEveryone: boolean) => {
    try {
      if (forEveryone) {
        await deleteMessage(messageId, true);
      } else {
        if (messageRefs.current[messageId]) {
          messageRefs.current[messageId].classList.add('hidden');
        }
      }
    } catch (error) {
      console.error("Error deleting message:", error);
      Sentry.captureException(error);
      toast.error("Failed to delete message", {
        description: "Please try again later"
      });
    }
  };

  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
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
            const isDeleted = !!message.deleted_at;
            
            return (
              <div 
                key={`${message.id}-${message.timestamp}`}
                className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                ref={el => {
                  if (el) {
                    messageRefs.current[message.id] = el;
                  }
                }}
              >
                <div 
                  className={`relative max-w-[80%] px-3 py-2 rounded-lg font-serif text-sm
                    ${isCurrentUser 
                      ? 'bg-bookconnect-sage/80 text-white rounded-tr-none' 
                      : 'bg-bookconnect-terracotta/20 text-bookconnect-brown rounded-tl-none'
                    } ${isDeleted ? 'opacity-70' : ''} transition-all duration-300 ease-in-out`}
                >
                  <div className={`text-xs mb-1 ${isCurrentUser ? 'text-white/80' : 'text-bookconnect-brown/70'}`}>
                    {message.username}
                  </div>
                  
                  {originalMessage && (
                    <div 
                      className={`text-xs mb-1 italic cursor-pointer ${
                        isCurrentUser ? 'text-white/70' : 'text-bookconnect-brown/60'
                      }`}
                      onClick={() => scrollToMessage(originalMessage.id)}
                    >
                      Replying to {originalMessage.username}: {
                        originalMessage.deleted_at 
                          ? "Message deleted" 
                          : originalMessage.message.length > 30
                            ? `${originalMessage.message.substring(0, 30)}...`
                            : originalMessage.message
                      }
                    </div>
                  )}
                  
                  <div style={{ wordBreak: "break-word" }}>
                    {isDeleted ? (
                      <span className="italic opacity-75">Message deleted</span>
                    ) : (
                      message.message
                    )}
                  </div>
                  
                  {!isDeleted && (
                    <div className="absolute top-2 right-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-5 w-5 p-0 text-bookconnect-brown/60 hover:text-bookconnect-brown"
                          >
                            <MoreVertical size={12} />
                            <span className="sr-only">Message actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent 
                          align={isMobile ? "center" : "end"}
                          className="bg-[#f0e6d2] border-bookconnect-brown/20 w-[120px]"
                        >
                          <DropdownMenuItem 
                            className="flex items-center cursor-pointer text-bookconnect-brown"
                            onClick={() => onReplyToMessage(message)}
                          >
                            <Reply size={14} className="mr-2" />
                            <span>Reply</span>
                          </DropdownMenuItem>
                          
                          {isCurrentUser && (
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger className="flex items-center text-bookconnect-brown">
                                <Trash2 size={14} className="mr-2" />
                                <span>Delete</span>
                              </DropdownMenuSubTrigger>
                              <DropdownMenuSubContent className="bg-[#f0e6d2] border-bookconnect-brown/20">
                                <DropdownMenuItem 
                                  className="cursor-pointer text-bookconnect-brown"
                                  onClick={() => handleDeleteMessage(message.id, true)}
                                >
                                  For Everyone
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="cursor-pointer text-bookconnect-brown"
                                  onClick={() => handleDeleteMessage(message.id, false)}
                                >
                                  For Me Only
                                </DropdownMenuItem>
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>
                          )}
                          
                          <DropdownMenuSeparator className="bg-bookconnect-brown/10" />
                          
                          <MessageReactions 
                            messageId={message.id} 
                            currentUsername={currentUsername} 
                          />
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                  
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
