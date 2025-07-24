import { useEffect, useCallback } from "react";
import { getBookChat } from "@/services/chatService";
import { useConnectionStatus } from '../useConnectionStatus';
import { handleChatError, isNetworkError } from '@/lib/errorHandling';
import { toast } from "sonner";
import * as Sentry from "@sentry/react";

interface UseDiscussionDataProps {
  id: string;
  username: string;
  connectionError: boolean;
  reconnectAttempts: number;
  oldestMessageTimestamp: string | null;
  isLoadingOlderMessages: boolean;
  hasMoreMessages: boolean;
  setMessages: (messages: any) => void;
  setLoading: (loading: boolean) => void;
  setConnectionError: (error: boolean) => void;
  setOnlineUsers: (users: string[]) => void;
  setReconnectAttempts: (attempts: number | ((prev: number) => number)) => void;
  setHasMoreMessages: (hasMore: boolean) => void;
  setOldestMessageTimestamp: (timestamp: string | null) => void;
  setIsLoadingOlderMessages: (loading: boolean) => void;
}

/**
 * Hook for managing data fetching and pagination in book discussions
 * Handles initial chat history loading and pagination
 */
export function useDiscussionData({
  id,
  username,
  connectionError,
  reconnectAttempts,
  oldestMessageTimestamp,
  isLoadingOlderMessages,
  hasMoreMessages,
  setMessages,
  setLoading,
  setConnectionError,
  setOnlineUsers,
  setReconnectAttempts,
  setHasMoreMessages,
  setOldestMessageTimestamp,
  setIsLoadingOlderMessages
}: UseDiscussionDataProps) {
  const { checkConnection } = useConnectionStatus();

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
  }, [connectionError, id, reconnectAttempts, checkConnection]);

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
        setMessages((prevMessages: any) => [...result.messages, ...prevMessages]);

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
    loadOlderMessages
  };
}
