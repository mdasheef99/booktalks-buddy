
import React, { useState } from "react";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { Reply, Trash2, MoreHorizontal } from "lucide-react";
import { ChatMessage, deleteMessage } from "@/services/chat/messageService";
import { toast } from "sonner";
import MessageReaction from "./MessageReaction";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

interface MessageActionsProps {
  message: ChatMessage;
  currentUsername: string;
  isCurrentUser: boolean;
  onReplyToMessage: (message: ChatMessage) => void;
  isMobile: boolean;
  onReactionsUpdated?: (messageId: string) => void;
}

const MessageActions: React.FC<MessageActionsProps> = ({
  message,
  currentUsername,
  isCurrentUser,
  onReplyToMessage,
  isMobile,
  onReactionsUpdated = () => {}
}) => {
  const [showActions, setShowActions] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Check if message is deleted
  const isDeleted = !!message.deleted_at;

  const handleReply = () => {
    onReplyToMessage(message);
    setDropdownOpen(false);
  };

  const handleDelete = async () => {
    try {
      console.log("Deleting message:", message.id);
      const success = await deleteMessage(message.id);

      if (success) {
        console.log("Message deleted successfully");
        toast.success("Message deleted");
      }
    } catch (error) {
      console.error("Error deleting message:", error);
      toast.error("Failed to delete message");
    } finally {
      setDropdownOpen(false);
    }
  };

  // If message is deleted, don't show any actions
  if (isDeleted) {
    return null;
  }

  return (
    <>
      {/* Action buttons in top-right corner of message bubble */}
      <div className={`absolute top-2 ${isCurrentUser ? 'right-2' : 'right-2'} flex items-center space-x-2`}>
        {/* Reaction emoji button */}
        <MessageReaction
          messageId={message.id}
          currentUsername={currentUsername}
          onReactionsUpdated={onReactionsUpdated}
          isDeleted={isDeleted}
        />

        {/* Three-dot menu */}
        <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <button className="p-1.5 rounded-full hover:bg-bookconnect-terracotta/10 text-bookconnect-brown/80">
              <MoreHorizontal size={16} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={isCurrentUser ? "end" : "end"} className="w-auto min-w-32 p-2 bg-white shadow-md">
            {/* Display actions in dropdown */}
            <div className="flex flex-col gap-1">
              {/* Reply button */}
              <DropdownMenuItem
                onClick={handleReply}
                className="flex items-center text-sm text-bookconnect-brown/80 hover:bg-bookconnect-terracotta/10 px-3 py-1.5 rounded cursor-pointer"
              >
                <Reply size={15} className="mr-2" />
                <span>Reply</span>
              </DropdownMenuItem>

              {/* Delete button (only for user's own messages) */}
              {isCurrentUser && (
                <HoverCard openDelay={300}>
                  <HoverCardTrigger asChild>
                    <DropdownMenuItem
                      onClick={handleDelete}
                      className="flex items-center text-sm text-red-500 hover:bg-red-100 px-3 py-1.5 rounded cursor-pointer"
                    >
                      <Trash2 size={15} className="mr-2" />
                      <span>Delete</span>
                    </DropdownMenuItem>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-auto px-3 py-1.5">
                    <p className="text-xs">This will delete the message for everyone</p>
                  </HoverCardContent>
                </HoverCard>
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
};

export default MessageActions;
