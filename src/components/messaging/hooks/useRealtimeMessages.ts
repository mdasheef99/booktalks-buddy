/**
 * Direct Messaging System - Real-time Messages Hook
 * 
 * Custom hook for subscribing to real-time message updates using Supabase Realtime.
 * Handles subscription lifecycle, error handling, and message processing.
 */

import { useEffect, useRef } from 'react';
import { subscribeToConversationMessages, unsubscribeFromConversation } from '@/lib/api/messaging';
import { DMMessage } from '@/lib/api/messaging/types';

interface UseRealtimeMessagesOptions {
  enabled?: boolean;
  onError?: (error: Error) => void;
  onStatusChange?: (status: string) => void;
}

/**
 * Hook for subscribing to real-time messages in a conversation
 * 
 * @param conversationId - The conversation to subscribe to
 * @param onMessage - Callback when a new message is received
 * @param options - Additional options for the subscription
 */
export function useRealtimeMessages(
  conversationId: string | null,
  onMessage: (message: DMMessage) => void,
  options: UseRealtimeMessagesOptions = {}
) {
  const { enabled = true, onError, onStatusChange } = options;
  const subscriptionRef = useRef<any>(null);
  const onMessageRef = useRef(onMessage);
  const onErrorRef = useRef(onError);
  const onStatusChangeRef = useRef(onStatusChange);

  // Update refs when callbacks change
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    onStatusChangeRef.current = onStatusChange;
  }, [onStatusChange]);

  useEffect(() => {
    // Don't subscribe if disabled or no conversation ID
    if (!enabled || !conversationId) {
      return;
    }

    // Clean up existing subscription
    if (subscriptionRef.current) {
      unsubscribeFromConversation(subscriptionRef.current);
      subscriptionRef.current = null;
    }

    // Create new subscription
    try {
      subscriptionRef.current = subscribeToConversationMessages({
        conversation_id: conversationId,
        onMessage: (message: DMMessage) => {
          onMessageRef.current?.(message);
        },
        onError: (error: Error) => {
          console.error('Real-time message error:', error);
          onErrorRef.current?.(error);
        },
        onStatusChange: (status: string) => {
          console.log('Real-time status change:', status);
          onStatusChangeRef.current?.(status);
        }
      });
    } catch (error) {
      console.error('Failed to create real-time subscription:', error);
      onErrorRef.current?.(error as Error);
    }

    // Cleanup function
    return () => {
      if (subscriptionRef.current) {
        unsubscribeFromConversation(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [conversationId, enabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        unsubscribeFromConversation(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, []);
}

/**
 * Hook for subscribing to real-time conversation list updates
 * 
 * @param userId - The user whose conversations to monitor
 * @param onUpdate - Callback when conversations are updated
 * @param options - Additional options for the subscription
 */
export function useRealtimeConversations(
  userId: string | null,
  onUpdate: () => void,
  options: UseRealtimeMessagesOptions = {}
) {
  const { enabled = true, onError } = options;
  const subscriptionRef = useRef<any>(null);
  const onUpdateRef = useRef(onUpdate);
  const onErrorRef = useRef(onError);

  // Update refs when callbacks change
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    // Don't subscribe if disabled or no user ID
    if (!enabled || !userId) {
      return;
    }

    // Clean up existing subscription
    if (subscriptionRef.current) {
      // Note: This would use a different unsubscribe function for conversations
      // For now, we'll use the same pattern
      unsubscribeFromConversation(subscriptionRef.current);
      subscriptionRef.current = null;
    }

    // Create new subscription for conversation list updates
    try {
      // This would be implemented similar to subscribeToConversationMessages
      // but for conversation list changes
      console.log('Setting up conversation list subscription for user:', userId);
      
      // Placeholder for actual implementation
      // subscriptionRef.current = subscribeToUserConversations(userId, onUpdateRef.current, onErrorRef.current);
    } catch (error) {
      console.error('Failed to create conversation list subscription:', error);
      onErrorRef.current?.(error as Error);
    }

    // Cleanup function
    return () => {
      if (subscriptionRef.current) {
        unsubscribeFromConversation(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [userId, enabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        unsubscribeFromConversation(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, []);
}

/**
 * Hook for managing multiple real-time subscriptions
 * Useful for components that need to subscribe to multiple conversations
 */
export function useMultipleRealtimeMessages(
  subscriptions: Array<{
    conversationId: string;
    onMessage: (message: DMMessage) => void;
  }>,
  options: UseRealtimeMessagesOptions = {}
) {
  const { enabled = true, onError, onStatusChange } = options;
  const subscriptionsRef = useRef<any[]>([]);

  useEffect(() => {
    // Don't subscribe if disabled
    if (!enabled) {
      return;
    }

    // Clean up existing subscriptions
    subscriptionsRef.current.forEach(subscription => {
      unsubscribeFromConversation(subscription);
    });
    subscriptionsRef.current = [];

    // Create new subscriptions
    subscriptions.forEach(({ conversationId, onMessage }) => {
      try {
        const subscription = subscribeToConversationMessages({
          conversation_id: conversationId,
          onMessage,
          onError,
          onStatusChange
        });
        subscriptionsRef.current.push(subscription);
      } catch (error) {
        console.error(`Failed to create subscription for conversation ${conversationId}:`, error);
        onError?.(error as Error);
      }
    });

    // Cleanup function
    return () => {
      subscriptionsRef.current.forEach(subscription => {
        unsubscribeFromConversation(subscription);
      });
      subscriptionsRef.current = [];
    };
  }, [subscriptions, enabled, onError, onStatusChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      subscriptionsRef.current.forEach(subscription => {
        unsubscribeFromConversation(subscription);
      });
      subscriptionsRef.current = [];
    };
  }, []);
}

/**
 * Hook for real-time connection status monitoring
 */
export function useRealtimeConnectionStatus() {
  const [isConnected, setIsConnected] = useState(true);
  const [connectionError, setConnectionError] = useState<Error | null>(null);

  useEffect(() => {
    // Monitor Supabase real-time connection status
    // This would integrate with Supabase's connection status events
    
    const handleConnectionChange = (status: string) => {
      setIsConnected(status === 'SUBSCRIBED');
      if (status === 'CHANNEL_ERROR') {
        setConnectionError(new Error('Real-time connection failed'));
      } else {
        setConnectionError(null);
      }
    };

    // Placeholder for actual connection monitoring
    console.log('Setting up real-time connection monitoring');

    return () => {
      console.log('Cleaning up real-time connection monitoring');
    };
  }, []);

  return { isConnected, connectionError };
}

// Import useState for the connection status hook
import { useState } from 'react';
