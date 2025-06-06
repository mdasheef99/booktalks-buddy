# Direct Messaging System - API Specification

## Overview

This document defines the API layer for the BookConnect Direct Messaging system, including function signatures, data types, permission enforcement, and integration patterns with the existing codebase.

## File Structure

```
src/lib/api/messaging/
├── index.ts          # Main API functions export
├── core.ts           # Core messaging operations
├── types.ts          # TypeScript interfaces and types
├── permissions.ts    # Permission checking utilities
└── utils.ts          # Helper functions and utilities
```

## Core Data Types

### File: `src/lib/api/messaging/types.ts`

```typescript
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

// API Response Types
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

// Error Types
export interface MessagingError {
  code: string;
  message: string;
  details?: Record<string, any>;
}
```

## Permission System Integration

### File: `src/lib/api/messaging/permissions.ts`

```typescript
import { getUserEntitlements } from '@/lib/entitlements/cache';
import { hasEntitlement, hasContextualEntitlement } from '@/lib/entitlements/permissions';

/**
 * Check if user can initiate direct message conversations
 */
export async function canInitiateConversations(userId: string): Promise<boolean> {
  const entitlements = await getUserEntitlements(userId);

  return hasEntitlement(entitlements, 'CAN_SEND_DIRECT_MESSAGES') ||
         hasEntitlement(entitlements, 'CAN_INITIATE_DIRECT_MESSAGES');
}

/**
 * Check if user can send messages (reply to existing conversations)
 */
export async function canSendMessages(userId: string): Promise<boolean> {
  // All authenticated users can reply to existing conversations
  return true;
}

/**
 * Check if user has administrative messaging privileges
 */
export async function hasAdminMessagingPrivileges(
  userId: string,
  storeId: string
): Promise<boolean> {
  const entitlements = await getUserEntitlements(userId);

  return hasContextualEntitlement(entitlements, 'STORE_MANAGER', storeId) ||
         hasContextualEntitlement(entitlements, 'STORE_OWNER', storeId);
}

/**
 * Get user's message retention period based on tier
 */
export async function getUserRetentionPeriod(userId: string): Promise<MessageRetentionInfo> {
  const entitlements = await getUserEntitlements(userId);

  if (hasEntitlement(entitlements, 'CAN_SEND_DIRECT_MESSAGES')) {
    // Privileged Plus tier
    return {
      tier: 'privileged_plus',
      retention_days: 365,
      expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    };
  } else if (hasEntitlement(entitlements, 'CAN_INITIATE_DIRECT_MESSAGES')) {
    // Privileged tier
    return {
      tier: 'privileged',
      retention_days: 180,
      expires_at: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString()
    };
  } else {
    // Free tier
    return {
      tier: 'free',
      retention_days: 30,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };
  }
}
```

## Utility Functions

### File: `src/lib/api/messaging/utils.ts`

```typescript
import { supabase } from '@/lib/supabase';

/**
 * Get user's store ID through club membership
 */
export async function getUserStoreId(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('club_members')
    .select('book_clubs!inner(store_id)')
    .eq('user_id', userId)
    .limit(1)
    .single();

  if (error || !data) {
    return null;
  }

  return data.book_clubs?.store_id || null;
}

/**
 * Check if two users are in the same store
 */
export async function areUsersInSameStore(
  userId1: string,
  userId2: string
): Promise<boolean> {
  const [store1, store2] = await Promise.all([
    getUserStoreId(userId1),
    getUserStoreId(userId2)
  ]);

  return store1 !== null && store1 === store2;
}

/**
 * Find user by username within the same store
 */
export async function findUserInStore(
  searcherUserId: string,
  targetUsername: string
): Promise<{ id: string; username: string; displayname: string } | null> {
  const searcherStoreId = await getUserStoreId(searcherUserId);
  if (!searcherStoreId) return null;

  // Find user by username
  const { data: targetUser, error } = await supabase
    .from('users')
    .select('id, username, displayname')
    .eq('username', targetUsername)
    .single();

  if (error || !targetUser) return null;

  // Verify target user is in same store
  const targetStoreId = await getUserStoreId(targetUser.id);
  if (targetStoreId !== searcherStoreId) return null;

  return targetUser;
}

/**
 * Check if conversation exists between two users
 */
export async function findExistingConversation(
  userId1: string,
  userId2: string,
  storeId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('conversations')
    .select('id')
    .eq('store_id', storeId)
    .in('id',
      supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', userId1)
        .in('conversation_id',
          supabase
            .from('conversation_participants')
            .select('conversation_id')
            .eq('user_id', userId2)
        )
    )
    .single();

  return error ? null : data?.id || null;
}

/**
 * Validate message content
 */
export function validateMessageContent(content: string): { valid: boolean; error?: string } {
  if (!content || typeof content !== 'string') {
    return { valid: false, error: 'Message content is required' };
  }

  const trimmed = content.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: 'Message cannot be empty' };
  }

  if (trimmed.length > 1000) {
    return { valid: false, error: 'Message too long (maximum 1000 characters)' };
  }

  return { valid: true };
}

/**
 * Calculate unread message count for a conversation
 */
export async function getUnreadMessageCount(
  conversationId: string,
  userId: string
): Promise<number> {
  // Get user's last read timestamp
  const { data: participant } = await supabase
    .from('conversation_participants')
    .select('last_read_at')
    .eq('conversation_id', conversationId)
    .eq('user_id', userId)
    .single();

  if (!participant) return 0;

  // Count messages sent after last read time
  const { count } = await supabase
    .from('direct_messages')
    .select('*', { count: 'exact', head: true })
    .eq('conversation_id', conversationId)
    .eq('is_deleted', false)
    .gt('sent_at', participant.last_read_at)
    .neq('sender_id', userId); // Don't count own messages

  return count || 0;
}
```

## Core API Functions

### File: `src/lib/api/messaging/core.ts`

```typescript
import { supabase } from '@/lib/supabase';
import {
  DMConversation,
  DMMessage,
  StartConversationResponse,
  SendMessageResponse,
  ConversationListResponse,
  MessageHistoryResponse,
  MessagingError
} from './types';
import {
  canInitiateConversations,
  getUserRetentionPeriod
} from './permissions';
import {
  getUserStoreId,
  findUserInStore,
  findExistingConversation,
  validateMessageContent,
  getUnreadMessageCount
} from './utils';

/**
 * Start a new conversation or return existing one
 */
export async function startConversation(
  initiatorId: string,
  recipientUsername: string
): Promise<StartConversationResponse> {
  // 1. Check initiator permissions
  const canInitiate = await canInitiateConversations(initiatorId);
  if (!canInitiate) {
    throw new Error('Only Privileged+ members can start conversations');
  }

  // 2. Get store context
  const storeId = await getUserStoreId(initiatorId);
  if (!storeId) {
    throw new Error('Unable to determine store context');
  }

  // 3. Find recipient in same store
  const recipient = await findUserInStore(initiatorId, recipientUsername);
  if (!recipient) {
    throw new Error('User not found in your store');
  }

  // 4. Check for existing conversation
  const existingConversationId = await findExistingConversation(
    initiatorId,
    recipient.id,
    storeId
  );

  if (existingConversationId) {
    return {
      conversation_id: existingConversationId,
      is_existing: true
    };
  }

  // 5. Create new conversation
  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .insert({ store_id: storeId })
    .select('id')
    .single();

  if (convError) throw convError;

  // 6. Add participants
  const { error: participantsError } = await supabase
    .from('conversation_participants')
    .insert([
      { conversation_id: conversation.id, user_id: initiatorId },
      { conversation_id: conversation.id, user_id: recipient.id }
    ]);

  if (participantsError) throw participantsError;

  return {
    conversation_id: conversation.id,
    is_existing: false
  };
}

/**
 * Send a message in a conversation
 */
export async function sendMessage(
  senderId: string,
  conversationId: string,
  content: string
): Promise<SendMessageResponse> {
  // 1. Validate content
  const validation = validateMessageContent(content);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // 2. Check if user is participant
  const { data: participant, error: participantError } = await supabase
    .from('conversation_participants')
    .select('user_id')
    .eq('conversation_id', conversationId)
    .eq('user_id', senderId)
    .single();

  if (participantError || !participant) {
    throw new Error('Unauthorized to send message');
  }

  // 3. Get retention info for message
  const retentionInfo = await getUserRetentionPeriod(senderId);

  // 4. Insert message
  const { data: message, error: messageError } = await supabase
    .from('direct_messages')
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      content: content.trim(),
      retention_expires_at: retentionInfo.expires_at
    })
    .select(`
      id,
      conversation_id,
      sender_id,
      content,
      sent_at,
      is_deleted,
      sender:users!sender_id(username, displayname)
    `)
    .single();

  if (messageError) throw messageError;

  // 5. Update conversation timestamp
  await supabase
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId);

  return message as SendMessageResponse;
}

/**
 * Get user's conversations with pagination
 */
export async function getUserConversations(
  userId: string,
  limit: number = 20,
  offset: number = 0
): Promise<ConversationListResponse> {
  const { data, error, count } = await supabase
    .from('conversations')
    .select(`
      id,
      store_id,
      created_at,
      updated_at,
      participants:conversation_participants!inner(
        user_id,
        last_read_at,
        user:users(id, username, displayname)
      ),
      last_message:direct_messages(
        content,
        sent_at,
        sender_id
      )
    `, { count: 'exact' })
    .eq('participants.user_id', userId)
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  // Transform data to include other participant and unread count
  const conversations: DMConversation[] = await Promise.all(
    (data || []).map(async (conv) => {
      const otherParticipant = conv.participants.find(p => p.user_id !== userId);
      const unreadCount = await getUnreadMessageCount(conv.id, userId);

      return {
        ...conv,
        other_participant: otherParticipant?.user || null,
        last_message: conv.last_message?.[0] || null,
        unread_count: unreadCount
      };
    })
  );

  return {
    conversations,
    total_count: count || 0
  };
}

/**
 * Get messages for a conversation with pagination
 */
export async function getConversationMessages(
  conversationId: string,
  userId: string,
  limit: number = 50,
  beforeMessageId?: string
): Promise<MessageHistoryResponse> {
  let query = supabase
    .from('direct_messages')
    .select(`
      id,
      conversation_id,
      sender_id,
      content,
      sent_at,
      is_deleted,
      sender:users!sender_id(username, displayname)
    `)
    .eq('conversation_id', conversationId)
    .eq('is_deleted', false)
    .order('sent_at', { ascending: false })
    .limit(limit + 1); // Get one extra to check if there are more

  // Add cursor-based pagination if beforeMessageId provided
  if (beforeMessageId) {
    const { data: cursorMessage } = await supabase
      .from('direct_messages')
      .select('sent_at')
      .eq('id', beforeMessageId)
      .single();

    if (cursorMessage) {
      query = query.lt('sent_at', cursorMessage.sent_at);
    }
  }

  const { data, error } = await query;
  if (error) throw error;

  const messages = (data || []).slice(0, limit).reverse(); // Reverse for chronological order
  const hasMore = (data || []).length > limit;
  const nextCursor = hasMore ? data?.[limit]?.id : undefined;

  // Mark messages as read
  await supabase
    .from('conversation_participants')
    .update({ last_read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .eq('user_id', userId);

  return {
    messages: messages as DMMessage[],
    has_more: hasMore,
    next_cursor: nextCursor
  };
}

/**
 * Mark conversation as read
 */
export async function markConversationAsRead(
  conversationId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('conversation_participants')
    .update({ last_read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .eq('user_id', userId);

  if (error) throw error;
}

/**
 * Soft delete a message
 */
export async function deleteMessage(
  messageId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('direct_messages')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString()
    })
    .eq('id', messageId)
    .eq('sender_id', userId);

  if (error) throw error;
}
```

## Real-Time Integration

### Supabase Realtime Configuration

```typescript
// Real-time subscription for conversation messages
export function subscribeToConversationMessages(
  conversationId: string,
  onMessage: (message: DMMessage) => void,
  onError?: (error: Error) => void
) {
  const subscription = supabase
    .channel(`conversation:${conversationId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'direct_messages',
      filter: `conversation_id=eq.${conversationId}`
    }, (payload) => {
      // Transform payload to DMMessage format
      const message = payload.new as DMMessage;
      onMessage(message);
    })
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'direct_messages',
      filter: `conversation_id=eq.${conversationId}`
    }, (payload) => {
      // Handle message updates (e.g., soft deletes)
      const message = payload.new as DMMessage;
      onMessage(message);
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('Subscribed to conversation:', conversationId);
      } else if (status === 'CHANNEL_ERROR' && onError) {
        onError(new Error('Real-time subscription error'));
      }
    });

  return subscription;
}

// Unsubscribe from real-time updates
export function unsubscribeFromConversation(subscription: any) {
  return supabase.removeChannel(subscription);
}
```

## Error Handling

### Standard Error Responses

```typescript
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
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED'
} as const;
```

## Related Documents

- **[Architecture Overview](./architecture_overview.md)**: System design context for these APIs
- **[Database Design](./database_design.md)**: Schema and data model used by these functions
- **[Frontend Implementation](./frontend_implementation.md)**: UI components consuming these APIs
- **[Deployment Guide](./deployment_guide.md)**: API deployment and configuration

## Implementation Notes

1. **Error Handling**: All functions should throw descriptive errors for proper UI feedback
2. **Performance**: Use efficient queries with proper indexing for scalability
3. **Security**: Rely on RLS policies and permission checks for data protection
4. **Real-Time**: Optimize Supabase Realtime usage for 300-500 concurrent users
5. **Testing**: Comprehensive unit tests for all API functions and edge cases
