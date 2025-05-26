/**
 * Direct Messaging System - Type Definitions
 *
 * This file contains all TypeScript interfaces and types used throughout
 * the Direct Messaging system for type safety and consistency.
 */

// =========================
// Core Data Types
// =========================

export interface DMConversation {
  id: string;
  store_id: string;
  created_at: string;
  updated_at: string;
  other_participant: {
    id: string;
    username: string;
    displayname: string;
  };
  last_message?: {
    content: string;
    sent_at: string;
    sender_id: string;
  };
  unread_count: number;
}

export interface DMMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  sent_at: string;
  is_deleted: boolean;
  reply_to_id?: string;
  replied_message?: {
    id: string;
    content: string;
    sender: {
      username: string;
      displayname: string;
    };
  };
  sender: {
    username: string;
    displayname: string;
  };
}

export interface ConversationParticipant {
  conversation_id: string;
  user_id: string;
  joined_at: string;
  last_read_at: string;
}

export interface MessageRetentionInfo {
  tier: 'free' | 'privileged' | 'privileged_plus';
  retention_days: number;
  expires_at: string;
}

// =========================
// API Response Types
// =========================

export interface StartConversationResponse {
  conversation_id: string;
  is_existing: boolean;
}

export interface SendMessageResponse extends DMMessage {}

export interface ConversationListResponse {
  conversations: DMConversation[];
  total_count: number;
}

export interface MessageHistoryResponse {
  messages: DMMessage[];
  has_more: boolean;
  next_cursor?: string;
}

// =========================
// API Request Types
// =========================

export interface StartConversationRequest {
  initiator_id: string;
  recipient_username: string;
}

export interface SendMessageRequest {
  sender_id: string;
  conversation_id: string;
  content: string;
  reply_to_id?: string;
}

export interface DeleteMessageRequest {
  message_id: string;
  user_id: string;
}

export interface GetConversationsRequest {
  user_id: string;
  limit?: number;
  offset?: number;
}

export interface GetMessagesRequest {
  conversation_id: string;
  user_id: string;
  limit?: number;
  before_message_id?: string;
}

// =========================
// Database Types (Raw)
// =========================

export interface ConversationRow {
  id: string;
  store_id: string;
  created_at: string;
  updated_at: string;
}

export interface ConversationParticipantRow {
  conversation_id: string;
  user_id: string;
  joined_at: string;
  last_read_at: string;
}

export interface DirectMessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  sent_at: string;
  is_deleted: boolean;
  deleted_at: string | null;
  retention_expires_at: string | null;
  reply_to_id: string | null;
}

// =========================
// User Types
// =========================

export interface MessagingUser {
  id: string;
  username: string;
  displayname: string;
}

export interface UserWithStoreContext extends MessagingUser {
  store_id: string;
}

// =========================
// Permission Types
// =========================

export type MessagingPermission =
  | 'CAN_INITIATE_DIRECT_MESSAGES'  // Privileged tier
  | 'CAN_SEND_DIRECT_MESSAGES'      // Privileged Plus tier
  | 'CAN_REPLY_TO_MESSAGES';        // All tiers

export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
  required_tier?: string;
}

// =========================
// Error Types
// =========================

export interface MessagingError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export class MessagingAPIError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'MessagingAPIError';
  }
}

// Common error codes
export const ERROR_CODES = {
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  CONVERSATION_NOT_FOUND: 'CONVERSATION_NOT_FOUND',
  INVALID_CONTENT: 'INVALID_CONTENT',
  STORE_CONTEXT_ERROR: 'STORE_CONTEXT_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR'
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

// =========================
// Real-time Types
// =========================

export interface RealtimeMessagePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: DirectMessageRow;
  old?: DirectMessageRow;
}

export interface RealtimeSubscriptionConfig {
  conversation_id: string;
  onMessage: (message: DMMessage) => void;
  onError?: (error: Error) => void;
  onStatusChange?: (status: string) => void;
}

// =========================
// Utility Types
// =========================

export interface PaginationParams {
  limit?: number;
  offset?: number;
  cursor?: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  details?: Record<string, any>;
}

export interface StoreContext {
  store_id: string;
  store_name?: string;
}

// =========================
// Configuration Types
// =========================

export interface MessagingConfig {
  max_message_length: number;
  max_conversations_per_user: number;
  retention_policies: {
    free: number;
    privileged: number;
    privileged_plus: number;
  };
  realtime_enabled: boolean;
  pagination_limits: {
    conversations: number;
    messages: number;
  };
}

// =========================
// Analytics Types (Future)
// =========================

export interface MessageAnalytics {
  total_messages: number;
  active_conversations: number;
  messages_today: number;
  average_response_time: number;
}

export interface ConversationAnalytics {
  participant_count: number;
  message_count: number;
  last_activity: string;
  created_at: string;
}
