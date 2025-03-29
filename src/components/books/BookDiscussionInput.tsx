
import React, { useState, useRef, useEffect } from "react";
import { Send, Smile, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { ChatMessage } from "@/services/chatService";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";

interface EmojiCategory {
  name: string;
  emojis: string[];
}

interface BookDiscussionInputProps {
  onSendMessage: (message: string, replyToId?: string) => Promise<void>;
  replyTo?: ChatMessage | null;
  onCancelReply: () => void;
}

// Common emoji categories with a selection of popular emojis
const emojiCategories: EmojiCategory[] = [
  {
    name: "Smileys",
    emojis: ["😀", "😁", "😂", "🥰", "😊", "😎", "🙂", "😍", "😘", "🤔", "🙄", "😴", "😮", "🥺"]
  },
  {
    name: "Gestures",
    emojis: ["👍", "👎", "👌", "✌️", "🤞", "👏", "🙌", "👋", "🤝", "✋", "👇", "👆", "👉", "👈"]
  },
  {
    name: "Objects",
    emojis: ["📚", "🔍", "📝", "📖", "🏆", "🎵", "🎬", "📱", "💻", "⌚", "🎁", "💡", "🔑", "🔒"]
  },
  {
    name: "Nature",
    emojis: ["🌸", "🌹", "🌈", "☀️", "🌙", "⭐", "🌟", "🍀", "🍁", "🌲", "🐶", "🐱", "🦋", "🐢"]
  },
  {
    name: "Food",
    emojis: ["☕", "🍔", "🍕", "🍰", "🍩", "🍦", "🍫", "🍪", "🥗", "🍷", "🥂", "🧁", "🍎", "🍓"]
  }
];

const BookDiscussionInput: React.FC<BookDiscussionInputProps> = ({ 
  onSendMessage, 
  replyTo,
  onCancelReply 
}) => {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      await onSendMessage(message, replyTo?.id);
      setMessage("");
      toast.dismiss("message-error");
      
      if (replyTo) {
        onCancelReply();
      }
      
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try again.", {
        id: "message-error",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const addEmoji = (emoji: string) => {
    setMessage(prev => prev + emoji);
    setIsEmojiPickerOpen(false);
    // Focus the input after adding emoji
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };
  
  return (
    <TooltipProvider>
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-1 border border-bookconnect-brown/20">
        {replyTo && (
          <div className="mx-2 mt-1 p-2 bg-bookconnect-terracotta/10 rounded text-sm font-serif border-l-2 border-bookconnect-brown/50 flex items-start justify-between">
            <div className="flex-1">
              <div className="text-xs font-medium text-bookconnect-brown">
                {replyTo.username}
              </div>
              <p className="text-bookconnect-brown/80 text-xs italic truncate">
                {replyTo.deleted_at ? "Message deleted" : replyTo.message}
              </p>
            </div>
            <Button 
              type="button"
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 text-bookconnect-brown/50 hover:text-bookconnect-brown hover:bg-transparent -mt-1"
              onClick={onCancelReply}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Cancel reply</span>
            </Button>
          </div>
        )}
        
        <div className="flex items-center">
          <DropdownMenu open={isEmojiPickerOpen} onOpenChange={setIsEmojiPickerOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-bookconnect-brown/70 hover:text-bookconnect-brown hover:bg-transparent"
                onClick={() => setIsEmojiPickerOpen(true)}
              >
                <Smile className="h-4 w-4" />
                <span className="sr-only">Add emoji</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="p-2 max-h-[300px] overflow-y-auto w-[250px]">
              <div className="grid grid-cols-1 gap-2">
                {emojiCategories.map((category) => (
                  <div key={category.name} className="space-y-1">
                    <p className="text-xs font-medium text-bookconnect-brown/70 px-1">{category.name}</p>
                    <div className="grid grid-cols-7 gap-1">
                      {category.emojis.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => addEmoji(emoji)}
                          className="text-lg hover:bg-bookconnect-terracotta/10 rounded p-1 transition-colors"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={replyTo ? "Type your reply..." : "Share your thoughts..."}
            disabled={isSubmitting}
            className="flex-1 p-1 bg-transparent border-none focus:outline-none font-serif text-bookconnect-brown text-sm h-7"
            ref={inputRef}
          />
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                type="submit" 
                disabled={!message.trim() || isSubmitting} 
                className="bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90 text-white h-7 w-7 p-0"
              >
                {isSubmitting ? (
                  <div className="h-3 w-3 border-t-transparent border-solid animate-spin rounded-full border-white border"></div>
                ) : (
                  <Send className="h-3 w-3" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Send message</TooltipContent>
          </Tooltip>
        </div>
      </form>
    </TooltipProvider>
  );
};

export default BookDiscussionInput;
