
import React, { useState, useEffect } from "react";
import { addReaction, getMessageReactions, subscribeToReactions } from "@/services/chat/messageService";
import { Smile } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface MessageReactionProps { 
  messageId: string; 
  currentUsername: string;
  onReactionsUpdated: (messageId: string) => void;
}

export interface ReactionData {
  reaction: string;
  count: number;
  userReacted: boolean;
  username: string;
}

export const MessageReaction = ({ messageId, currentUsername, onReactionsUpdated }: MessageReactionProps) => {
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
      console.log("Adding reaction:", emoji, "to message:", messageId);
      
      // Check if user already reacted with any emoji
      const userHasReacted = reactions.some(r => r.userReacted);
      const existingReaction = reactions.find(r => r.userReacted);
      
      // If user already reacted with any emoji, remove that reaction first
      if (userHasReacted && existingReaction) {
        console.log("User already reacted with:", existingReaction.reaction, "removing that first");
        await addReaction(messageId, currentUsername, existingReaction.reaction);
      }
      
      // Add the new reaction if it's different from the existing one
      if (!userHasReacted || (existingReaction && existingReaction.reaction !== emoji)) {
        await addReaction(messageId, currentUsername, emoji);
      }
      
      // Immediately reload reactions after adding a new one
      const updatedReactions = await getMessageReactions(messageId);
      console.log("Updated reactions after adding:", updatedReactions);
      setReactions(updatedReactions);
      
      // Notify parent components that reactions were updated
      onReactionsUpdated(messageId);
    } catch (error) {
      console.error("Error adding reaction:", error);
    }
  };

  // Prevent event bubbling that might close the popover
  const handleEmojiClick = (emoji: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleReact(emoji);
    setIsOpen(false); // Close the popover after selecting an emoji
  };

  return (
    <Popover 
      open={isOpen} 
      onOpenChange={(open) => {
        setIsOpen(open);
      }}
    >
      <PopoverTrigger asChild>
        <button 
          className="p-1.5 rounded-full hover:bg-bookconnect-terracotta/10 text-bookconnect-brown/80 transition-colors duration-200"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsOpen(true);
          }}
        >
          <Smile size={16} />
        </button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-3 bg-white shadow-lg rounded-xl border-bookconnect-brown/10" 
        align="start" 
        sideOffset={5}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex space-x-2.5" onClick={(e) => e.stopPropagation()}>
          {availableReactions.map(emoji => (
            <button 
              key={emoji}
              className="text-xl p-2 hover:bg-bookconnect-terracotta/10 rounded-full transition-transform hover:scale-110"
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
