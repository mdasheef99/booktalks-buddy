
import React, { useState, useRef, useEffect, useCallback, memo } from "react";
import { Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ChatMessage } from "@/services/chatService";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import EmojiPicker from "./chat/EmojiPicker";

interface BookDiscussionInputProps {
  onSendMessage: (message: string, replyToId?: string) => Promise<void>;
  replyTo?: ChatMessage | null;
  onCancelReply: () => void;
}

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

  const [sendError, setSendError] = useState<string | null>(null);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setSendError(null);

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

      // Set local error state for inline display
      setSendError("Failed to send message. Please try again.");

      // We don't show a toast here because our error handling utility already does that
    } finally {
      setIsSubmitting(false);
    }
  }, [message, isSubmitting, onSendMessage, replyTo, onCancelReply]);

  const addEmoji = useCallback((emoji: string) => {
    setMessage(prev => prev + emoji);
    // Don't auto-close the emoji picker

    // Focus the input after adding emoji
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  }, []);

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

        {sendError && (
          <div
            id="send-error"
            className="mx-2 mb-1 p-1 bg-red-50 text-red-600 text-xs rounded border border-red-200 flex items-center"
            role="alert"
            aria-live="polite"
          >
            <div className="mr-1 flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            {sendError}
            <button
              type="button"
              className="ml-auto text-red-500 hover:text-red-700"
              onClick={() => setSendError(null)}
              aria-label="Dismiss error"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        <div className="flex items-center">
          <EmojiPicker
            onEmojiSelect={addEmoji}
            isOpen={isEmojiPickerOpen}
            onOpenChange={setIsEmojiPickerOpen}
          />

          <input
            type="text"
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              if (sendError) setSendError(null);
            }}
            placeholder={replyTo ? "Type your reply..." : "Share your thoughts..."}
            disabled={isSubmitting}
            className={`flex-1 p-1 bg-transparent border-none focus:outline-none font-serif text-bookconnect-brown text-sm h-7 focus-visible ${sendError ? 'border-red-300' : ''}`}
            ref={inputRef}
            aria-label={replyTo ? `Reply to ${replyTo.username}` : "Type your message"}
            aria-describedby={sendError ? "send-error" : undefined}
          />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="submit"
                disabled={!message.trim() || isSubmitting}
                className="bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90 text-white h-7 w-7 p-0 focus-visible"
                aria-label={replyTo ? "Send reply" : "Send message"}
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

export default memo(BookDiscussionInput);
