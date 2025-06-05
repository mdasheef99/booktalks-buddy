/**
 * Data Retrieval Types
 * 
 * Shared types and interfaces for data retrieval operations
 */

// Re-export core types from main types file
export type {
  DMConversation,
  DMMessage,
  ConversationListResponse,
  MessageHistoryResponse,
  ERROR_CODES
} from '../types';

// Data retrieval specific types
export interface DatabaseTableStatus {
  conversations: boolean;
  conversation_participants: boolean;
  direct_messages: boolean;
  users: boolean;
}

export interface ConversationStatsResult {
  total_messages: number;
  messages_by_user: Record<string, number>;
  first_message_date: string | null;
  last_message_date: string | null;
}

export interface MessageSearchOptions {
  conversationId: string;
  userId: string;
  searchTerm: string;
  limit?: number;
}

export interface ConversationQueryOptions {
  userId: string;
  limit?: number;
  offset?: number;
}

export interface MessageQueryOptions {
  conversationId: string;
  userId: string;
  limit?: number;
  beforeMessageId?: string;
}
