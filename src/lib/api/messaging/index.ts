/**
 * Direct Messaging System - Main API Export
 *
 * This file serves as the main entry point for the messaging API,
 * exporting all functions, types, and utilities for use throughout the application.
 */

// =========================
// Core API Functions
// =========================

// Conversation Management Functions
export {
  startConversation,
  getConversationDetails,
  markConversationAsRead
} from './conversation-management';

// Message Operations Functions
export {
  sendMessage,
  deleteMessage,
  canUserModifyMessage,
  getMessageDetails,
  updateConversationTimestamp
} from './message-operations';

// Data Retrieval Functions (from modular structure)
export {
  getUserConversations,
  getConversationMessages,
  searchConversationMessages,
  getConversationStats,
  verifyDatabaseTables,
  getUserConversationsDefault,
  getConversationMessagesDefault,
  searchMessagesDefault,
  getConversationById,
  getMessageById,
  getUserMessagingStats,
  getConversationTimeline,
  getMostActiveConversations,
  isUserParticipant,
  getConversationParticipants,
  getUserInfo,
  getUsersInfo,
  getLastMessage,
  getMessageCount,
  getConversationCreatedAt,
  conversationExists,
  getConversationStoreId,
  batchGetSenderInfo,
  areAllTablesAccessible,
  getTableStatusReport
} from './data-retrieval/';

// =========================
// Permission Functions
// =========================
export {
  canInitiateConversations,
  canSendMessages,
  hasAdminMessagingPrivileges,
  checkMessagingPermission,
  getUserRetentionPeriod,
  getUserRetentionDays,
  hasRetentionTier,
  getUserMessagingTier,
  canUpgradeForMessaging,
  requireMessagingPermission,
  getUserMessagingPermissions
} from './permissions';

// =========================
// Utility Functions
// =========================
export {
  getUserStoreId,
  areUsersInSameStore,
  getUserStoreContext,
  findUserInStore,
  searchUsersInStore,
  getUsersInStore,
  findExistingConversation,
  isUserInConversation,
  validateMessageContent,
  validateUsername,
  getUnreadMessageCount,
  formatMessagingError,
  sanitizeContent,
  getConversationDisplayName
} from './utils';

// =========================
// Type Definitions
// =========================
export type {
  // Core data types
  DMConversation,
  DMMessage,
  ConversationParticipant,
  MessageRetentionInfo,

  // API response types
  StartConversationResponse,
  SendMessageResponse,
  ConversationListResponse,
  MessageHistoryResponse,

  // API request types
  StartConversationRequest,
  SendMessageRequest,
  GetConversationsRequest,
  GetMessagesRequest,

  // Database types
  ConversationRow,
  ConversationParticipantRow,
  DirectMessageRow,

  // User types
  MessagingUser,
  UserWithStoreContext,

  // Permission types
  MessagingPermission,
  PermissionCheckResult,

  // Error types
  MessagingError,
  ErrorCode,

  // Real-time types
  RealtimeMessagePayload,
  RealtimeSubscriptionConfig,

  // Utility types
  PaginationParams,
  ValidationResult,
  StoreContext,
  MessagingConfig,
  MessageAnalytics,
  ConversationAnalytics,

  // Data retrieval types
  DatabaseTableStatus,
  ConversationStatsResult,
  MessageSearchOptions,
  ConversationQueryOptions,
  MessageQueryOptions
} from './types';

// =========================
// Error Constants
// =========================
export {
  MessagingAPIError,
  ERROR_CODES
} from './types';

// =========================
// Real-time Functions
// =========================

import { supabase } from '@/lib/supabase';
import { DMMessage, RealtimeSubscriptionConfig } from './types';

/**
 * Subscribe to real-time messages for a conversation
 */
export function subscribeToConversationMessages(
  config: RealtimeSubscriptionConfig
) {
  const { conversation_id, onMessage, onError, onStatusChange } = config;

  const subscription = supabase
    .channel(`conversation:${conversation_id}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'direct_messages',
      filter: `conversation_id=eq.${conversation_id}`
    }, async (payload) => {
      try {
        // Fetch complete message data with sender info and reply data
        const { data: messageData } = await supabase
          .from('direct_messages')
          .select(`
            id,
            conversation_id,
            sender_id,
            content,
            sent_at,
            is_deleted,
            reply_to_id
          `)
          .eq('id', payload.new.id)
          .single();

        if (messageData) {
          // Get sender info
          const { data: senderData } = await supabase
            .from('users')
            .select('username, displayname')
            .eq('id', messageData.sender_id)
            .single();

          // Get replied message info if this is a reply
          let repliedMessage = undefined;
          if (messageData.reply_to_id) {
            const { data: originalMsg } = await supabase
              .from('direct_messages')
              .select(`
                id,
                content,
                sender_id
              `)
              .eq('id', messageData.reply_to_id)
              .single();

            if (originalMsg) {
              const { data: originalSenderData } = await supabase
                .from('users')
                .select('username, displayname')
                .eq('id', originalMsg.sender_id)
                .single();

              repliedMessage = {
                id: originalMsg.id,
                content: originalMsg.content,
                sender: {
                  username: originalSenderData?.username || '',
                  displayname: originalSenderData?.displayname || ''
                }
              };
            }
          }

          // Transform to DMMessage format
          const transformedMessage: DMMessage = {
            id: messageData.id,
            conversation_id: messageData.conversation_id,
            sender_id: messageData.sender_id,
            content: messageData.content,
            sent_at: messageData.sent_at,
            is_deleted: messageData.is_deleted,
            reply_to_id: messageData.reply_to_id,
            replied_message: repliedMessage,
            sender: {
              username: senderData?.username || '',
              displayname: senderData?.displayname || ''
            }
          };

          onMessage(transformedMessage);
        }
      } catch (error) {
        console.error('Error processing real-time message:', error);
        onError?.(error as Error);
      }
    })
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'direct_messages',
      filter: `conversation_id=eq.${conversation_id}`
    }, async (payload) => {
      try {
        // Handle message updates (e.g., soft deletes)
        const { data: messageData } = await supabase
          .from('direct_messages')
          .select(`
            id,
            conversation_id,
            sender_id,
            content,
            sent_at,
            is_deleted,
            reply_to_id
          `)
          .eq('id', payload.new.id)
          .single();

        if (messageData) {
          // Get sender info
          const { data: senderData } = await supabase
            .from('users')
            .select('username, displayname')
            .eq('id', messageData.sender_id)
            .single();

          // Get replied message info if this is a reply
          let repliedMessage = undefined;
          if (messageData.reply_to_id) {
            const { data: originalMsg } = await supabase
              .from('direct_messages')
              .select(`
                id,
                content,
                sender_id
              `)
              .eq('id', messageData.reply_to_id)
              .single();

            if (originalMsg) {
              const { data: originalSenderData } = await supabase
                .from('users')
                .select('username, displayname')
                .eq('id', originalMsg.sender_id)
                .single();

              repliedMessage = {
                id: originalMsg.id,
                content: originalMsg.content,
                sender: {
                  username: originalSenderData?.username || '',
                  displayname: originalSenderData?.displayname || ''
                }
              };
            }
          }

          // Transform to DMMessage format
          const transformedMessage: DMMessage = {
            id: messageData.id,
            conversation_id: messageData.conversation_id,
            sender_id: messageData.sender_id,
            content: messageData.content,
            sent_at: messageData.sent_at,
            is_deleted: messageData.is_deleted,
            reply_to_id: messageData.reply_to_id,
            replied_message: repliedMessage,
            sender: {
              username: senderData?.username || '',
              displayname: senderData?.displayname || ''
            }
          };

          onMessage(transformedMessage);
        }
      } catch (error) {
        console.error('Error processing real-time message update:', error);
        onError?.(error as Error);
      }
    })
    .subscribe((status) => {
      onStatusChange?.(status);

      if (status === 'SUBSCRIBED') {
        console.log('Subscribed to conversation:', conversation_id);
      } else if (status === 'CHANNEL_ERROR') {
        console.error('Real-time subscription error for conversation:', conversation_id);
        onError?.(new Error('Real-time subscription failed'));
      }
    });

  return subscription;
}

/**
 * Unsubscribe from real-time updates
 */
export function unsubscribeFromConversation(subscription: any) {
  return supabase.removeChannel(subscription);
}

/**
 * Subscribe to conversation list updates for a user
 */
export function subscribeToUserConversations(
  userId: string,
  onUpdate: () => void,
  onError?: (error: Error) => void
) {
  const subscription = supabase
    .channel(`user_conversations:${userId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'conversations'
    }, () => {
      onUpdate();
    })
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'conversation_participants',
      filter: `user_id=eq.${userId}`
    }, () => {
      onUpdate();
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('Subscribed to user conversations:', userId);
      } else if (status === 'CHANNEL_ERROR') {
        console.error('Real-time subscription error for user conversations:', userId);
        onError?.(new Error('Conversation list subscription failed'));
      }
    });

  return subscription;
}

// =========================
// Configuration and Constants
// =========================

/**
 * Default messaging configuration
 */
export const DEFAULT_MESSAGING_CONFIG: import('./types').MessagingConfig = {
  max_message_length: 1000,
  max_conversations_per_user: 100, // Reasonable limit for UI performance
  retention_policies: {
    free: 30,
    privileged: 180,
    privileged_plus: 365
  },
  realtime_enabled: true,
  pagination_limits: {
    conversations: 20,
    messages: 50
  }
};

/**
 * Messaging feature flags and limits
 */
export const MESSAGING_LIMITS = {
  MESSAGE_LENGTH: 1000,
  CONVERSATION_PAGINATION: 20,
  MESSAGE_PAGINATION: 50,
  MAX_CONCURRENT_SUBSCRIPTIONS: 5,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000 // milliseconds
} as const;

// =========================
// Helper Functions for Components
// =========================

/**
 * Format message timestamp for display
 */
export function formatMessageTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

  if (diffInHours < 1) {
    return 'Just now';
  } else if (diffInHours < 24) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffInHours < 168) { // 7 days
    return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
}

/**
 * Check if message is from today
 */
export function isMessageFromToday(timestamp: string): boolean {
  const messageDate = new Date(timestamp);
  const today = new Date();

  return messageDate.toDateString() === today.toDateString();
}

/**
 * Get conversation status text for UI
 */
export function getConversationStatus(conversation: DMConversation): string {
  if (!conversation.last_message) {
    return 'No messages yet';
  }

  const timeAgo = formatMessageTime(conversation.last_message.sent_at);
  return `Last message ${timeAgo}`;
}
