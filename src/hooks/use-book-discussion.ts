
import { useState, useEffect, useCallback, useRef } from "react";
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

  // Pagination state
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState(false);
  const [oldestMessageTimestamp, setOldestMessageTimestamp] = useState<string | null>(null);

  const { isOnline, isOffline, checkConnection } = useConnectionStatus();

  // Load chat history when component mounts
  useEffect(() => {
    const loadChatHistory = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setConnectionError(false);
        console.log("Loading chat history for book:", id, "with username:", username);

        // Use the updated getBookChat function with pagination support
        const result = await getBookChat(id, { limit: 30 });
        console.log("Got chat history:", result);

        setMessages(result.messages);
        setHasMoreMessages(result.hasMore);

        // Set the oldest message timestamp for pagination
        if (result.messages.length > 0) {
          setOldestMessageTimestamp(result.messages[0].timestamp);
        } else {
          setOldestMessageTimestamp(null);
        }

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
          const result = await getBookChat(id, { limit: 30 });
          setMessages(result.messages);
          setHasMoreMessages(result.hasMore);

          // Update oldest message timestamp
          if (result.messages.length > 0) {
            setOldestMessageTimestamp(result.messages[0].timestamp);
          } else {
            setOldestMessageTimestamp(null);
          }

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

  // StrictMode-safe subscription management
  const subscriptionsRef = useRef<{
    chatSubscription: { unsubscribe: () => void } | null;
    presenceTracker: { unsubscribe: () => void } | null;
    isChatActive: boolean;
    isPresenceActive: boolean;
    chatHeartbeat: NodeJS.Timeout | null;
    presenceHeartbeat: NodeJS.Timeout | null;
  }>({
    chatSubscription: null,
    presenceTracker: null,
    isChatActive: false,
    isPresenceActive: false,
    chatHeartbeat: null,
    presenceHeartbeat: null,
  });

  // Unified real-time subscriptions (chat + presence) - StrictMode Safe
  useEffect(() => {
    if (!id || !username) return;

    console.log("[Hook] Setting up unified real-time subscriptions for book:", id, "user:", username);

    // Prevent duplicate subscriptions in StrictMode
    if (subscriptionsRef.current.isChatActive || subscriptionsRef.current.isPresenceActive) {
      console.log("[Hook] Subscriptions already active, skipping setup");
      return;
    }

    const setupUnifiedSubscriptions = async () => {
      const subs = subscriptionsRef.current;

      // Setup chat subscription
      if (!subs.isChatActive) {
        try {
          console.log("[Hook] Creating new chat subscription for book:", id);
          subs.chatSubscription = subscribeToChat(id, (newMessage) => {
            console.log("[Hook] Received new message in component:", newMessage);

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

          subs.isChatActive = true;
          console.log("[Hook] Chat subscription created successfully");

          // Set up chat heartbeat
          subs.chatHeartbeat = setInterval(() => {
            if (connectionError && isOnline && !subs.isChatActive) {
              console.log("[Hook] Connection appears to be restored, attempting to resubscribe to chat");
              setupUnifiedSubscriptions();
            }
          }, 10000);

        } catch (error) {
          console.error("[Hook] Error setting up chat subscription:", error);
          setConnectionError(true);
          subs.isChatActive = false;

          // Try to reconnect after a delay
          setTimeout(() => {
            if (!subs.isChatActive) {
              setupUnifiedSubscriptions();
            }
          }, 5000);
        }
      }

      // Setup presence tracking
      if (!subs.isPresenceActive) {
        try {
          console.log("[Hook] Creating new presence tracker for book:", id, "user:", username);
          subs.presenceTracker = trackPresence(id, username, (onlineUsers) => {
            console.log("[Hook] Online users updated:", onlineUsers);
            setOnlineUsers(onlineUsers);

            // If we're receiving presence updates, we're connected
            if (connectionError) {
              setConnectionError(false);
            }
          });

          subs.isPresenceActive = true;
          console.log("[Hook] Presence tracking created successfully");

          // Set up presence heartbeat
          subs.presenceHeartbeat = setInterval(() => {
            if (connectionError && isOnline && !subs.isPresenceActive) {
              console.log("[Hook] Connection appears to be restored, attempting to reconnect presence");
              setupUnifiedSubscriptions();
            }
          }, 15000);

        } catch (error) {
          console.error("[Hook] Error setting up presence tracking:", error);
          subs.isPresenceActive = false;

          // Try to reconnect after a delay
          setTimeout(() => {
            if (!subs.isPresenceActive) {
              setupUnifiedSubscriptions();
            }
          }, 5000);
        }
      }
    };

    // Initial setup
    setupUnifiedSubscriptions();

    // StrictMode-safe cleanup function
    return () => {
      const subs = subscriptionsRef.current;
      console.log("[Hook] Cleaning up unified subscriptions for book:", id, "user:", username);

      // Clear heartbeat intervals
      if (subs.chatHeartbeat) {
        clearInterval(subs.chatHeartbeat);
        subs.chatHeartbeat = null;
      }
      if (subs.presenceHeartbeat) {
        clearInterval(subs.presenceHeartbeat);
        subs.presenceHeartbeat = null;
      }

      // Mark as inactive
      subs.isChatActive = false;
      subs.isPresenceActive = false;

      // Cleanup chat subscription
      if (subs.chatSubscription) {
        try {
          console.log("[Hook] Cleaning up chat subscription");
          subs.chatSubscription.unsubscribe();
          subs.chatSubscription = null;
        } catch (e) {
          console.error("[Hook] Error during chat unsubscribe:", e);
        }
      }

      // Cleanup presence tracker
      if (subs.presenceTracker) {
        try {
          console.log("[Hook] Cleaning up presence tracker");
          subs.presenceTracker.unsubscribe();
          subs.presenceTracker = null;
        } catch (e) {
          console.error("[Hook] Error during presence unsubscribe:", e);
        }
      }
    };
  }, [id, username]); // Unified dependencies - FIXES RACE CONDITION



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
  }, [id, username, title, author, coverUrl, isOnline, queueMessage, sendChatMessage]);

  const handleReplyToMessage = useCallback((message: ChatMessage) => {
    setReplyTo(message);
  }, []);

  const handleCancelReply = useCallback(() => {
    setReplyTo(null);
  }, []);

  // Function to load older messages (for pagination)
  const loadOlderMessages = useCallback(async () => {
    if (!id || !oldestMessageTimestamp || isLoadingOlderMessages || !hasMoreMessages) {
      return;
    }

    try {
      setIsLoadingOlderMessages(true);
      console.log("Loading older messages before timestamp:", oldestMessageTimestamp);

      const result = await getBookChat(id, {
        limit: 20,
        beforeTimestamp: oldestMessageTimestamp
      });

      if (result.messages.length > 0) {
        // Prepend older messages to the existing messages
        setMessages(prevMessages => [...result.messages, ...prevMessages]);

        // Update the oldest message timestamp
        setOldestMessageTimestamp(result.messages[0].timestamp);
      }

      // Update whether there are more messages to load
      setHasMoreMessages(result.hasMore);

    } catch (error) {
      console.error("Error loading older messages:", error);

      // Report to Sentry
      Sentry.captureException(error, {
        tags: { component: "BookDiscussion", action: "loadOlderMessages" },
        extra: { bookId: id }
      });

      // Show error toast
      toast.error("Couldn't load older messages", {
        description: "Please try again later",
        duration: 3000,
      });
    } finally {
      setIsLoadingOlderMessages(false);
    }
  }, [id, oldestMessageTimestamp, isLoadingOlderMessages, hasMoreMessages]);

  return {
    messages,
    loading,
    connectionError,
    replyTo,
    onlineUsers,
    pendingMessages,
    hasMoreMessages,
    isLoadingOlderMessages,
    handleSendMessage,
    handleReplyToMessage,
    handleCancelReply,
    loadOlderMessages
  };
}
