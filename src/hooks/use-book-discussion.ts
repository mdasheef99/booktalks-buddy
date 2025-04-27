
import { useState, useEffect } from "react";
import { ChatMessage, subscribeToChat, getBookChat, sendChatMessage, trackPresence } from "@/services/chatService";
import * as Sentry from "@sentry/react";
import { toast } from "sonner";

import { useConnectionStatus } from './useConnectionStatus';
import { handleChatError, isNetworkError } from '@/lib/errorHandling';
import { queueMessage, getPendingMessageCount } from '@/services/chat/messageQueue';

export function useBookDiscussion(id: string, title: string, author: string, username: string, coverUrl: string = "") {
  console.log("useBookDiscussion - Book ID:", id, "Title:", title, "Author:", author, "Cover URL:", coverUrl);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(false);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([username]); // Current user is always online
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const { isOnline, isOffline, checkConnection } = useConnectionStatus();

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

        // Reset reconnect attempts on successful load
        setReconnectAttempts(0);

      } catch (error) {
        console.error("Error loading chat history:", error);
        setConnectionError(true);

        // Check if it's a network error
        if (isNetworkError(error)) {
          handleChatError(
            error,
            "Load Chat History",
            { bookId: id },
            "Connection issue. Trying to reconnect..."
          );
        } else {
          handleChatError(
            error,
            "Load Chat History",
            { bookId: id }
          );
        }
      } finally {
        setLoading(false);
      }
    };

    loadChatHistory();
  }, [id, username]);

  // Add automatic reconnection logic
  useEffect(() => {
    if (!connectionError || !id) return;

    const MAX_RECONNECT_ATTEMPTS = 5;
    const RECONNECT_INTERVAL = 5000; // 5 seconds

    // Don't try to reconnect if we've exceeded the maximum attempts
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.log(`Maximum reconnection attempts (${MAX_RECONNECT_ATTEMPTS}) reached`);
      return;
    }

    console.log(`Attempting to reconnect (attempt ${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})...`);

    const reconnectTimer = setTimeout(async () => {
      try {
        // Check connection first
        const isConnected = await checkConnection();

        if (isConnected) {
          // If we're online, try to reload chat history
          console.log("Connection restored, reloading chat history");
          const chatHistory = await getBookChat(id);
          setMessages(chatHistory);
          setConnectionError(false);
          setReconnectAttempts(0);

          toast.success("Reconnected to chat", {
            description: "Chat history has been updated",
            duration: 3000,
          });
        } else {
          // If still offline, increment the reconnect attempts
          setReconnectAttempts(prev => prev + 1);
        }
      } catch (error) {
        console.error("Reconnection attempt failed:", error);
        setReconnectAttempts(prev => prev + 1);
      }
    }, RECONNECT_INTERVAL);

    return () => clearTimeout(reconnectTimer);
  }, [connectionError, id, reconnectAttempts, checkConnection]); // Re-run when username changes

  // Subscribe to real-time chat updates
  useEffect(() => {
    if (!id) return;

    console.log("Setting up real-time subscription for book:", id);
    let subscription: { unsubscribe: () => void } | null = null;

    const setupSubscription = () => {
      try {
        subscription = subscribeToChat(id, (newMessage) => {
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

          // If we receive a message, we're definitely connected
          if (connectionError) {
            setConnectionError(false);
            setReconnectAttempts(0);
          }
        });
      } catch (error) {
        console.error("Error setting up chat subscription:", error);
        setConnectionError(true);

        // Try to reconnect after a delay
        setTimeout(setupSubscription, 5000);
      }
    };

    // Initial setup
    setupSubscription();

    // Set up a heartbeat to check the subscription is still active
    const heartbeatInterval = setInterval(() => {
      if (connectionError && isOnline) {
        console.log("Connection appears to be restored, attempting to resubscribe");

        // Clean up existing subscription if any
        if (subscription) {
          try {
            subscription.unsubscribe();
          } catch (e) {
            console.error("Error unsubscribing:", e);
          }
        }

        // Set up a new subscription
        setupSubscription();
      }
    }, 10000); // Check every 10 seconds

    return () => {
      console.log("Unsubscribing from chat");
      clearInterval(heartbeatInterval);
      if (subscription) {
        try {
          subscription.unsubscribe();
        } catch (e) {
          console.error("Error during unsubscribe:", e);
        }
      }
    };
  }, [id, connectionError, isOnline]);

  // Track presence of users in the chat
  useEffect(() => {
    if (!id || !username) return;

    console.log("Setting up presence tracking for book:", id);
    let presenceTracker: { unsubscribe: () => void } | null = null;

    const setupPresence = () => {
      try {
        presenceTracker = trackPresence(id, username, (onlineUsers) => {
          console.log("Online users updated:", onlineUsers);
          setOnlineUsers(onlineUsers);

          // If we're receiving presence updates, we're connected
          if (connectionError) {
            setConnectionError(false);
          }
        });
      } catch (error) {
        console.error("Error setting up presence tracking:", error);

        // Try to reconnect after a delay
        setTimeout(setupPresence, 5000);
      }
    };

    // Initial setup
    setupPresence();

    // Set up a heartbeat to check the presence tracking is still active
    const heartbeatInterval = setInterval(() => {
      if (connectionError && isOnline) {
        console.log("Connection appears to be restored, attempting to reconnect presence");

        // Clean up existing tracker if any
        if (presenceTracker) {
          try {
            presenceTracker.unsubscribe();
          } catch (e) {
            console.error("Error unsubscribing from presence:", e);
          }
        }

        // Set up a new tracker
        setupPresence();
      }
    }, 15000); // Check every 15 seconds

    return () => {
      console.log("Unsubscribing from presence tracking");
      clearInterval(heartbeatInterval);
      if (presenceTracker) {
        try {
          presenceTracker.unsubscribe();
        } catch (e) {
          console.error("Error during presence unsubscribe:", e);
        }
      }
    };
  }, [id, username, connectionError, isOnline]);



  // Track pending messages
  const [pendingMessages, setPendingMessages] = useState(0);

  // Update pending message count periodically
  useEffect(() => {
    const updatePendingCount = () => {
      const count = getPendingMessageCount();
      setPendingMessages(count);
    };

    // Check immediately
    updatePendingCount();

    // Then set up interval
    const interval = setInterval(updatePendingCount, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = async (message: string, replyToId?: string) => {
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
    pendingMessages,
    handleSendMessage,
    handleReplyToMessage,
    handleCancelReply
  };
}
