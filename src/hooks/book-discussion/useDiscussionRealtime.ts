import { useEffect } from "react";
import { ChatMessage, subscribeToChat, trackPresence } from "@/services/chatService";
import { useConnectionStatus } from '../useConnectionStatus';

interface UseDiscussionRealtimeProps {
  id: string;
  username: string;
  connectionError: boolean;
  setMessages: (updater: (prev: ChatMessage[]) => ChatMessage[]) => void;
  setConnectionError: (error: boolean) => void;
  setReconnectAttempts: (attempts: number) => void;
  setOnlineUsers: (users: string[]) => void;
}

/**
 * Hook for managing real-time subscriptions and presence in book discussions
 * Handles real-time message updates and user presence tracking
 */
export function useDiscussionRealtime({
  id,
  username,
  connectionError,
  setMessages,
  setConnectionError,
  setReconnectAttempts,
  setOnlineUsers
}: UseDiscussionRealtimeProps) {
  const { isOnline } = useConnectionStatus();

  // Subscribe to real-time chat updates
  useEffect(() => {
    if (!id) return;

    console.log("Setting up real-time subscription for book:", id);
    let subscription: { unsubscribe: () => void } | null = null;
    let isSubscriptionActive = false;

    const setupSubscription = () => {
      // Prevent multiple subscriptions
      if (isSubscriptionActive) {
        console.log("Subscription already active, skipping setup");
        return;
      }

      try {
        console.log("Creating new chat subscription for book:", id);
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

        isSubscriptionActive = true;
        console.log("Chat subscription created successfully");
      } catch (error) {
        console.error("Error setting up chat subscription:", error);
        setConnectionError(true);
        isSubscriptionActive = false;

        // Try to reconnect after a delay
        setTimeout(() => {
          if (!isSubscriptionActive) {
            setupSubscription();
          }
        }, 5000);
      }
    };

    // Initial setup
    setupSubscription();

    // Set up a heartbeat to check the subscription is still active
    const heartbeatInterval = setInterval(() => {
      if (connectionError && isOnline && !isSubscriptionActive) {
        console.log("Connection appears to be restored, attempting to resubscribe");
        setupSubscription();
      }
    }, 10000); // Check every 10 seconds

    return () => {
      console.log("Unsubscribing from chat");
      clearInterval(heartbeatInterval);
      isSubscriptionActive = false;

      if (subscription) {
        try {
          console.log("Cleaning up chat subscription");
          subscription.unsubscribe();
          subscription = null;
        } catch (e) {
          console.error("Error during unsubscribe:", e);
        }
      }
    };
  }, [id]); // Remove connectionError and isOnline from dependencies to prevent re-subscriptions

  // Track presence of users in the chat
  useEffect(() => {
    if (!id || !username) return;

    console.log("Setting up presence tracking for book:", id);
    let presenceTracker: { unsubscribe: () => void } | null = null;
    let isPresenceActive = false;

    const setupPresence = () => {
      // Prevent multiple presence trackers
      if (isPresenceActive) {
        console.log("Presence tracking already active, skipping setup");
        return;
      }

      try {
        console.log("Creating new presence tracker for book:", id, "user:", username);
        presenceTracker = trackPresence(id, username, (onlineUsers) => {
          console.log("Online users updated:", onlineUsers);
          setOnlineUsers(onlineUsers);

          // If we're receiving presence updates, we're connected
          if (connectionError) {
            setConnectionError(false);
          }
        });

        isPresenceActive = true;
        console.log("Presence tracking created successfully");
      } catch (error) {
        console.error("Error setting up presence tracking:", error);
        isPresenceActive = false;

        // Try to reconnect after a delay
        setTimeout(() => {
          if (!isPresenceActive) {
            setupPresence();
          }
        }, 5000);
      }
    };

    // Initial setup
    setupPresence();

    // Set up a heartbeat to check the presence tracking is still active
    const heartbeatInterval = setInterval(() => {
      if (connectionError && isOnline && !isPresenceActive) {
        console.log("Connection appears to be restored, attempting to reconnect presence");
        setupPresence();
      }
    }, 15000); // Check every 15 seconds

    return () => {
      console.log("Unsubscribing from presence tracking");
      clearInterval(heartbeatInterval);
      isPresenceActive = false;

      if (presenceTracker) {
        try {
          console.log("Cleaning up presence tracker");
          presenceTracker.unsubscribe();
          presenceTracker = null;
        } catch (e) {
          console.error("Error during presence unsubscribe:", e);
        }
      }
    };
  }, [id, username]); // Remove connectionError and isOnline from dependencies

  return {};
}
