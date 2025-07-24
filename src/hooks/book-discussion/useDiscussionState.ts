import { useState, useEffect } from "react";
import { ChatMessage } from "@/services/chatService";
import { getPendingMessageCount } from '@/services/chat/messageQueue';

/**
 * Hook for managing local state in book discussions
 * Handles all useState declarations and UI state management
 */
export function useDiscussionState(username: string) {
  // Core message state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(false);
  
  // UI interaction state
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  
  // User presence state
  const [onlineUsers, setOnlineUsers] = useState<string[]>([username]); // Current user is always online
  
  // Connection management state
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  // Pagination state
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState(false);
  const [oldestMessageTimestamp, setOldestMessageTimestamp] = useState<string | null>(null);

  // Message queue state
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

  // State update utilities
  const updateMessages = (updater: (prev: ChatMessage[]) => ChatMessage[]) => {
    setMessages(updater);
  };

  const updateConnectionError = (error: boolean) => {
    setConnectionError(error);
  };

  const updateLoading = (isLoading: boolean) => {
    setLoading(isLoading);
  };

  const updateOnlineUsers = (users: string[]) => {
    setOnlineUsers(users);
  };

  const updateReconnectAttempts = (attempts: number | ((prev: number) => number)) => {
    setReconnectAttempts(attempts);
  };

  const updatePaginationState = (
    hasMore: boolean,
    oldestTimestamp: string | null,
    isLoading?: boolean
  ) => {
    setHasMoreMessages(hasMore);
    setOldestMessageTimestamp(oldestTimestamp);
    if (isLoading !== undefined) {
      setIsLoadingOlderMessages(isLoading);
    }
  };

  const updateReplyTo = (message: ChatMessage | null) => {
    setReplyTo(message);
  };

  return {
    // State values
    messages,
    loading,
    connectionError,
    replyTo,
    onlineUsers,
    reconnectAttempts,
    hasMoreMessages,
    isLoadingOlderMessages,
    oldestMessageTimestamp,
    pendingMessages,
    
    // State updaters
    updateMessages,
    updateConnectionError,
    updateLoading,
    updateOnlineUsers,
    updateReconnectAttempts,
    updatePaginationState,
    updateReplyTo,
    
    // Direct setters for complex updates
    setMessages,
    setLoading,
    setConnectionError,
    setOnlineUsers,
    setReconnectAttempts,
    setHasMoreMessages,
    setIsLoadingOlderMessages,
    setOldestMessageTimestamp,
    setPendingMessages
  };
}
