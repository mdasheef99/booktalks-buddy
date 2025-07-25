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

  // Subscribe to real-time chat updates - StrictMode Safe
  useEffect(() => {
    if (!id) return;


    let subscription: { unsubscribe: () => void } | null = null;
    let isSubscriptionActive = false;
    let isMounted = true; // Track if component is still mounted

    const setupSubscription = () => {
      if (isSubscriptionActive || !isMounted) {
        return;
      }

      try {
        subscription = subscribeToChat(id, (newMessage) => {
          if (!isMounted) {
            return;
          }

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
      } catch (error) {
        console.error("Error setting up chat subscription:", error);
        if (isMounted) {
          setConnectionError(true);
        }
        isSubscriptionActive = false;


        setTimeout(() => {
          if (!isSubscriptionActive && isMounted) {
            setupSubscription();
          }
        }, 5000);
      }
    };


    const setupTimer = setTimeout(() => {
      if (isMounted) {
        setupSubscription();
      }
    }, 100);

    const heartbeatInterval = setInterval(() => {
      if (connectionError && isOnline && !isSubscriptionActive && isMounted) {
        setupSubscription();
      }
    }, 10000);

    return () => {
      isMounted = false;
      clearTimeout(setupTimer);
      clearInterval(heartbeatInterval);
      isSubscriptionActive = false;

      if (subscription) {
        try {
          subscription.unsubscribe();
          subscription = null;
        } catch (e) {
          console.error("Error during unsubscribe:", e);
        }
      }
    };
  }, [id]);

  // Track presence of users in the chat
  useEffect(() => {
    if (!id || !username) return;


    let presenceTracker: { unsubscribe: () => void } | null = null;
    let isPresenceActive = false;

    const setupPresence = () => {
      if (isPresenceActive) {
        return;
      }

      try {
        presenceTracker = trackPresence(id, username, (onlineUsers) => {
          setOnlineUsers(onlineUsers);

          // If we're receiving presence updates, we're connected
          if (connectionError) {
            setConnectionError(false);
          }
        });

        isPresenceActive = true;
      } catch (error) {
        console.error("Error setting up presence tracking:", error);
        isPresenceActive = false;


        setTimeout(() => {
          if (!isPresenceActive) {
            setupPresence();
          }
        }, 5000);
      }
    };


    setupPresence();

    const heartbeatInterval = setInterval(() => {
      if (connectionError && isOnline && !isPresenceActive) {
        setupPresence();
      }
    }, 15000);

    return () => {
      clearInterval(heartbeatInterval);
      isPresenceActive = false;

      if (presenceTracker) {
        try {
          presenceTracker.unsubscribe();
          presenceTracker = null;
        } catch (e) {
          console.error("Error during presence unsubscribe:", e);
        }
      }
    };
  }, [id, username]);

  return {};
}
