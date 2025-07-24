import { useCallback } from "react";
import { ChatMessage, sendChatMessage } from "@/services/chatService";
import { useConnectionStatus } from '../useConnectionStatus';
import { handleChatError, isNetworkError } from '@/lib/errorHandling';
import { queueMessage } from '@/services/chat/messageQueue';
import { toast } from "sonner";
import * as Sentry from "@sentry/react";

interface UseDiscussionActionsProps {
  id: string;
  title: string;
  author: string;
  username: string;
  coverUrl: string;
  setMessages: (updater: (prev: ChatMessage[]) => ChatMessage[]) => void;
  setReplyTo: (message: ChatMessage | null) => void;
}

/**
 * Hook for managing user actions in book discussions
 * Handles message sending, replies, and user interactions
 */
export function useDiscussionActions({
  id,
  title,
  author,
  username,
  coverUrl,
  setMessages,
  setReplyTo
}: UseDiscussionActionsProps) {
  const { isOnline } = useConnectionStatus();

  const handleSendMessage = useCallback(async (message: string, replyToId?: string) => {
    if (!id || !message.trim()) {
      console.error("Missing required data for sending message");
      return;
    }

    try {
      console.log("Sending message:", message, "for book:", id, "as user:", username);

      // Check if we're online
      if (!isOnline) {
        console.log("Device is offline, queueing message for later");

        // Queue the message for later sending
        queueMessage(
          message,
          id,
          username,
          title,
          author,
          undefined,
          replyToId,
          coverUrl
        );

        // Show a toast notification
        toast.info("You're offline", {
          description: "Message will be sent when connection is restored",
          duration: 5000,
        });

        // Return as if successful to clear the input
        return;
      }

      // If online, try to send immediately
      const result = await sendChatMessage(
        message,
        id,
        username,
        title,
        author,
        undefined,
        replyToId,
        coverUrl
      );

      if (!result) {
        console.error("No result returned from sendChatMessage");

        // Queue the message for retry
        queueMessage(
          message,
          id,
          username,
          title,
          author,
          undefined,
          replyToId,
          coverUrl
        );

        throw new Error("Failed to send message - empty result");
      } else {
        console.log("Message sent successfully:", result);

        // Immediately add the message to local state for instant display
        // The real-time subscription will handle updates/duplicates
        const newMessage: ChatMessage = {
          id: result.id,
          message: message,
          username: username,
          timestamp: result.timestamp || new Date().toISOString(),
          book_id: result.book_id,
          reply_to_id: replyToId || null,
          reactions: [],
          deleted_at: null
        };

        setMessages((prevMessages) => {
          // Check if message already exists (in case real-time was faster)
          if (prevMessages.some(msg => msg.id === newMessage.id)) {
            return prevMessages;
          }
          // Add the new message
          return [...prevMessages, newMessage];
        });

        console.log("Message added to local state immediately");
      }
    } catch (error) {
      console.error("Error sending message:", error);

      // Check if it's a network error
      if (isNetworkError(error)) {
        console.log("Network error detected, queueing message for retry");

        // Queue the message for retry
        queueMessage(
          message,
          id,
          username,
          title,
          author,
          undefined,
          replyToId,
          coverUrl
        );

        // Show a toast notification
        toast.info("Connection issue", {
          description: "Message will be sent when connection is restored",
          duration: 5000,
        });

        // Don't rethrow, treat as success to clear input
        return;
      }

      // For other errors, report to Sentry and rethrow
      Sentry.captureException(error, {
        tags: { component: "BookDiscussion", action: "sendMessage" },
        extra: { bookId: id, username, title, author }
      });

      throw error; // Re-throw so the input component can handle it
    }
  }, [id, username, title, author, coverUrl, isOnline, setMessages]);

  const handleReplyToMessage = useCallback((message: ChatMessage) => {
    setReplyTo(message);
  }, [setReplyTo]);

  const handleCancelReply = useCallback(() => {
    setReplyTo(null);
  }, [setReplyTo]);

  return {
    handleSendMessage,
    handleReplyToMessage,
    handleCancelReply
  };
}
