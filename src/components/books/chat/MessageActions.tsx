
import React from "react";
import { ChatMessage, deleteMessage } from "@/services/chatService";
import { MoreHorizontal, Reply, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import MessageReaction from "./MessageReaction";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import * as Sentry from "@sentry/react";

interface MessageActionsProps {
  message: ChatMessage;
  currentUsername: string;
  isCurrentUser: boolean;
  onReplyToMessage: (message: ChatMessage) => void;
  isMobile: boolean;
}

const MessageActions: React.FC<MessageActionsProps> = ({
  message,
  currentUsername,
  isCurrentUser,
  onReplyToMessage,
  isMobile
}) => {
  const handleDeleteMessage = async (messageId: string, forEveryone: boolean) => {
    try {
      await deleteMessage(messageId, forEveryone);
    } catch (error) {
      console.error("Error deleting message:", error);
      Sentry.captureException(error);
      toast.error("Failed to delete message", {
        description: "Please try again later"
      });
    }
  };

  return (
    <div className="absolute top-2 right-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-5 w-5 p-0 text-bookconnect-brown/60 hover:text-bookconnect-brown"
          >
            <MoreHorizontal size={12} />
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
          
          <DropdownMenuItem 
            className="flex items-center cursor-pointer text-bookconnect-brown"
          >
            <MessageReaction 
              messageId={message.id} 
              currentUsername={currentUsername} 
            />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default MessageActions;
