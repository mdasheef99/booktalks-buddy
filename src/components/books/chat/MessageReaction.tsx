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
      // Keep popover open after clicking an emoji
      // Don't call setIsOpen(false) here
    } catch (error) {
      console.error("Error adding reaction:", error);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex items-center px-1.5 py-0 text-xs text-bookconnect-brown/50 hover:bg-bookconnect-terracotta/10 hover:text-bookconnect-brown"
        >
          <Smile size={14} className="mr-1.5" />
          <span>React</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="start" sideOffset={5} sticky="always">
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
};

export default MessageReaction;
