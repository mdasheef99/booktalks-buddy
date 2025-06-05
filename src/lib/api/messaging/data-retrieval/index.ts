/**
 * Data Retrieval Module - Main Export
 * 
 * Aggregates all data retrieval functionality with proper type exports
 */

// =========================
// Type Exports
// =========================
export type {
  DMConversation,
  DMMessage,
  ConversationListResponse,
  MessageHistoryResponse,
  ERROR_CODES,
  DatabaseTableStatus,
  ConversationStatsResult,
  MessageSearchOptions,
  ConversationQueryOptions,
  MessageQueryOptions
} from './types';

// =========================
// Database Verification
// =========================
export {
  verifyDatabaseTables,
  areAllTablesAccessible,
  getTableStatusReport
} from './database-verification';

// =========================
// Conversation Queries
// =========================
export {
  getUserConversations,
  getConversationById
} from './conversation-queries';

// =========================
// Message Queries
// =========================
export {
  getConversationMessages,
  searchConversationMessages,
  getMessageById
} from './message-queries';

// =========================
// Analytics Queries
// =========================
export {
  getConversationStats,
  getUserMessagingStats,
  getConversationTimeline,
  getMostActiveConversations
} from './analytics-queries';

// =========================
// Utility Functions
// =========================
export {
  isUserParticipant,
  getConversationParticipants,
  getUserInfo,
  getUsersInfo,
  getLastMessage,
  getMessageCount,
  getConversationCreatedAt,
  conversationExists,
  getConversationStoreId,
  batchGetSenderInfo
} from './utils';

// =========================
// Convenience Functions
// =========================

/**
 * Get user conversations with default options
 */
export async function getUserConversationsDefault(userId: string) {
  const { getUserConversations } = await import('./conversation-queries');
  return getUserConversations({ userId });
}

/**
 * Get conversation messages with default options
 */
export async function getConversationMessagesDefault(
  conversationId: string,
  userId: string
) {
  const { getConversationMessages } = await import('./message-queries');
  return getConversationMessages({ conversationId, userId });
}

/**
 * Search messages with default options
 */
export async function searchMessagesDefault(
  conversationId: string,
  userId: string,
  searchTerm: string
) {
  const { searchConversationMessages } = await import('./message-queries');
  return searchConversationMessages({ conversationId, userId, searchTerm });
}
