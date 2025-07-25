import { useDiscussionState } from './useDiscussionState';
import { useDiscussionData } from './useDiscussionData';
import { useDiscussionActions } from './useDiscussionActions';
import { useDiscussionRealtime } from './useDiscussionRealtime';

/**
 * Main hook that combines all book discussion functionality
 * Maintains the same public API as the original useBookDiscussion hook
 * for backward compatibility
 */
export function useBookDiscussion(
  id: string, 
  title: string, 
  author: string, 
  username: string, 
  coverUrl: string = ""
) {
  console.log("useBookDiscussion - Book ID:", id, "Title:", title, "Author:", author, "Cover URL:", coverUrl);

  // Initialize state management
  const state = useDiscussionState(username);

  // Initialize data fetching and pagination
  const { loadOlderMessages } = useDiscussionData({
    id,
    username,
    connectionError: state.connectionError,
    reconnectAttempts: state.reconnectAttempts,
    oldestMessageTimestamp: state.oldestMessageTimestamp,
    isLoadingOlderMessages: state.isLoadingOlderMessages,
    hasMoreMessages: state.hasMoreMessages,
    setMessages: state.setMessages,
    setLoading: state.setLoading,
    setConnectionError: state.setConnectionError,
    setOnlineUsers: state.setOnlineUsers,
    setReconnectAttempts: state.setReconnectAttempts,
    setHasMoreMessages: state.setHasMoreMessages,
    setOldestMessageTimestamp: state.setOldestMessageTimestamp,
    setIsLoadingOlderMessages: state.setIsLoadingOlderMessages
  });

  // Initialize user actions
  const { handleSendMessage, handleReplyToMessage, handleCancelReply } = useDiscussionActions({
    id,
    title,
    author,
    username,
    coverUrl,
    setMessages: state.updateMessages,
    setReplyTo: state.updateReplyTo
  });

  // Initialize real-time subscriptions
  useDiscussionRealtime({
    id,
    username,
    connectionError: state.connectionError,
    setMessages: state.updateMessages,
    setConnectionError: state.updateConnectionError,
    setReconnectAttempts: state.updateReconnectAttempts,
    setOnlineUsers: state.updateOnlineUsers
  });

  // Return the same interface as the original hook
  return {
    messages: state.messages,
    loading: state.loading,
    connectionError: state.connectionError,
    replyTo: state.replyTo,
    onlineUsers: state.onlineUsers,
    pendingMessages: state.pendingMessages,
    hasMoreMessages: state.hasMoreMessages,
    isLoadingOlderMessages: state.isLoadingOlderMessages,
    handleSendMessage,
    handleReplyToMessage,
    handleCancelReply,
    loadOlderMessages
  };
}
