
import { useState, useEffect } from "react";
import { ChatMessage, subscribeToChat, getBookChat, sendChatMessage, trackPresence } from "@/services/chatService";
import * as Sentry from "@sentry/react";
import { toast } from "sonner";

export function useBookDiscussion(id: string, title: string, author: string, username: string, coverUrl: string = "") {
  console.log("useBookDiscussion - Book ID:", id, "Title:", title, "Author:", author, "Cover URL:", coverUrl);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(false);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([username]); // Current user is always online

  // Load chat history when component mounts
  useEffect(() => {
    const loadChatHistory = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setConnectionError(false);
        console.log("Loading chat history for book:", id, "with username:", username);
        const chatHistory = await getBookChat(id);
        console.log("Got chat history:", chatHistory);
        setMessages(chatHistory);

        // Initialize with current user
        setOnlineUsers([username]);

      } catch (error) {
        console.error("Error loading chat history:", error);
        setConnectionError(true);
        Sentry.captureException(error, {
          tags: { component: "BookDiscussion", action: "loadChatHistory" },
          extra: { bookId: id }
        });
        toast.error("Couldn't load chat history. Please try refreshing the page.");
      } finally {
        setLoading(false);
      }
    };

    loadChatHistory();
  }, [id, username]); // Re-run when username changes

  // Subscribe to real-time chat updates
  useEffect(() => {
    if (!id) return;

    console.log("Setting up real-time subscription for book:", id);
    const subscription = subscribeToChat(id, (newMessage) => {
      console.log("Received new message in component:", newMessage);

      // Handle both new messages and updates to existing messages (deletions)
      setMessages((prevMessages) => {
        // Check if this is an update to an existing message
        if (prevMessages.some(msg => msg.id === newMessage.id)) {
          return prevMessages.map(msg =>
            msg.id === newMessage.id ? newMessage : msg
          );
        }
        // Otherwise it's a new message
        return [...prevMessages, newMessage];
      });

      setConnectionError(false);
    });

    return () => {
      console.log("Unsubscribing from chat");
      subscription.unsubscribe();
    };
  }, [id]);

  // Track presence of users in the chat
  useEffect(() => {
    if (!id || !username) return;

    console.log("Setting up presence tracking for book:", id);
    const presenceTracker = trackPresence(id, username, (onlineUsers) => {
      console.log("Online users updated:", onlineUsers);
      setOnlineUsers(onlineUsers);
    });

    return () => {
      console.log("Unsubscribing from presence tracking");
      presenceTracker.unsubscribe();
    };
  }, [id, username]);

  const handleSendMessage = async (message: string, replyToId?: string) => {
    if (!id || !message.trim()) {
      console.error("Missing required data for sending message");
      return;
    }

    try {
      console.log("Sending message:", message, "for book:", id, "as user:", username);
      // Pass the title and author to ensure the book exists in the database
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
        toast.error("Failed to send message. Please try again.");
        throw new Error("Failed to send message - empty result");
      } else {
        console.log("Message sent successfully:", result);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      Sentry.captureException(error, {
        tags: { component: "BookDiscussion", action: "sendMessage" },
        extra: { bookId: id, username, title, author }
      });
      throw error; // Re-throw so the input component can handle it
    }
  };

  const handleReplyToMessage = (message: ChatMessage) => {
    setReplyTo(message);
  };

  const handleCancelReply = () => {
    setReplyTo(null);
  };

  return {
    messages,
    loading,
    connectionError,
    replyTo,
    onlineUsers,
    handleSendMessage,
    handleReplyToMessage,
    handleCancelReply
  };
}
