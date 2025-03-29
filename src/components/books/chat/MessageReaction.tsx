
import React, { useState, useEffect } from "react";
import { addReaction, getMessageReactions, subscribeToReactions } from "@/services/chatService";
import { Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface MessageReactionProps { 
  messageId: string; 
  currentUsername: string;
}

export interface ReactionData {
  reaction: string;
  count: number;
  userReacted: boolean;
  username: string;
}

export const MessageReaction = ({ messageId, currentUsername }: MessageReactionProps) => {
  const [reactions, setReactions] = useState<ReactionData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  const availableReactions = ["👍", "👎", "❤️", "😂", "😮", "🎉", "📚"];
  
  // Load reactions when component mounts or messageId changes
  useEffect(() => {
    const loadReactions = async () => {
      setIsLoading(true);
      try {
        const data = await getMessageReactions(messageId);
        console.log("Loaded reactions:", data);
        setReactions(data);
      } catch (error) {
        console.error("Error loading reactions:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadReactions();
    
    // Subscribe to reaction updates
    const subscription = subscribeToReactions(messageId, () => {
      console.log("Reaction update received, reloading reactions");
      loadReactions();
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, [messageId]);
  
  const handleReact = async (emoji: string) => {
    try {
      console.log("Adding reaction:", emoji);
      await addReaction(messageId, currentUsername, emoji);
      // Important: Do NOT close the popover here
      
      // Reload reactions after adding a new one
      const updatedReactions = await getMessageReactions(messageId);
      console.log("Updated reactions:", updatedReactions);
      setReactions(updatedReactions);
    } catch (error) {
      console.error("Error adding reaction:", error);
    }
  };

  // Prevent event bubbling that might close the popover
  const handleEmojiClick = (emoji: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleReact(emoji);
  };

  return (
    <Popover 
      open={isOpen} 
      onOpenChange={(open) => {
        // Only allow manual opening/closing through the trigger button
        // This prevents closing when clicking inside the popover content
        if (!open) {
          // Only close if clicked outside
          setIsOpen(false);
        } else {
          setIsOpen(true);
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex items-center px-1.5 py-0 text-xs text-bookconnect-brown/50 hover:bg-bookconnect-terracotta/10 hover:text-bookconnect-brown"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(true);
          }}
        >
          <Smile size={14} className="mr-1.5" />
          <span>React</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-2" 
        align="start" 
        sideOffset={5}
        sticky="always"
        onInteractOutside={(e) => {
          e.preventDefault();
          // Only close when clicking outside the popover
        }}
        onEscapeKeyDown={(e) => {
          e.preventDefault();
          // Prevent closing on Escape key
        }}
        onPointerDownOutside={(e) => {
          e.preventDefault();
          // Prevent closing when clicking outside
        }}
      >
        <div className="flex space-x-1" onClick={(e) => e.stopPropagation()}>
          {availableReactions.map(emoji => (
            <button 
              key={emoji}
              className="text-lg p-1 hover:bg-bookconnect-terracotta/10 rounded-full transition-transform hover:scale-110"
              onClick={(e) => handleEmojiClick(emoji, e)}
            >
              {emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default MessageReaction;
