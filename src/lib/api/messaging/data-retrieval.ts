/**
 * Direct Messaging System - Data Retrieval
 *
 * This module handles data retrieval operations including fetching conversation lists,
 * message history, and related query operations with pagination support.
 */

import { supabase } from '@/lib/supabase';
import {
  DMConversation,
  DMMessage,
  ConversationListResponse,
  MessageHistoryResponse,
  ERROR_CODES
} from './types';
import {
  getUnreadMessageCount,
  formatMessagingError
} from './utils';

// =========================
// Database Verification
// =========================

/**
 * Verify that the required database tables exist and are accessible
 */
export async function verifyDatabaseTables(): Promise<{
  conversations: boolean;
  conversation_participants: boolean;
  direct_messages: boolean;
  users: boolean;
}> {
  const results = {
    conversations: false,
    conversation_participants: false,
    direct_messages: false,
    users: false
  };

  try {
    // Test conversations table
    const { error: convError } = await supabase
      .from('conversations')
      .select('id')
      .limit(1);
    results.conversations = !convError;

    // Test conversation_participants table
    const { error: partError } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .limit(1);
    results.conversation_participants = !partError;

    // Test direct_messages table
    const { error: msgError } = await supabase
      .from('direct_messages')
      .select('id')
      .limit(1);
    results.direct_messages = !msgError;

    // Test users table
    const { error: userError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    results.users = !userError;

  } catch (error) {
    console.error('Database verification failed:', error);
  }

  return results;
}

// =========================
// Conversation List Retrieval
// =========================

/**
 * Get user's conversations with pagination and unread counts
 */
export async function getUserConversations(
  userId: string,
  limit: number = 20,
  offset: number = 0
): Promise<ConversationListResponse> {
  try {
    // Step 1: Get conversation IDs where user is a participant
    const { data: participantData, error: participantError } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', userId);

    if (participantError) {
      console.error('Error getting user participation:', participantError);
      console.error('Full error details:', {
        message: participantError.message,
        details: participantError.details,
        hint: participantError.hint,
        code: participantError.code
      });

      // Check if this is a table relationship error
      if (participantError.message?.includes('Could not find a relationship') ||
          participantError.message?.includes('PGRST200')) {
        console.error('Database schema issue detected. Running verification...');
        const tableStatus = await verifyDatabaseTables();
        console.error('Table verification results:', tableStatus);

        throw formatMessagingError(
          ERROR_CODES.NETWORK_ERROR,
          'Database configuration issue. Please contact support.',
          {
            supabase_error: participantError,
            table_status: tableStatus
          }
        );
      }

      // Check if this is an HTTP 500 error (database function issue)
      if (participantError.message?.includes('500') ||
          participantError.code === 'PGRST000' ||
          participantError.details?.includes('function')) {
        console.error('Database function error detected. This may be due to missing migration dependencies.');

        throw formatMessagingError(
          ERROR_CODES.NETWORK_ERROR,
          'Database function error. Please ensure all migrations have been applied.',
          {
            supabase_error: participantError,
            suggestion: 'Check that all migration files have been executed in Supabase SQL Editor'
          }
        );
      }

      throw formatMessagingError(
        ERROR_CODES.NETWORK_ERROR,
        'Failed to load conversations. Please try again.',
        { supabase_error: participantError }
      );
    }

    // If user has no conversations, return empty result
    if (!participantData || participantData.length === 0) {
      return {
        conversations: [],
        total_count: 0
      };
    }

    const conversationIds = participantData.map(p => p.conversation_id);

    // Step 2: Get conversations with count
    const { data: conversationData, error: conversationError, count } = await supabase
      .from('conversations')
      .select(`
        id,
        store_id,
        created_at,
        updated_at
      `, { count: 'exact' })
      .in('id', conversationIds)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (conversationError) {
      console.error('Error getting conversations:', conversationError);
      throw formatMessagingError(
        ERROR_CODES.NETWORK_ERROR,
        'Failed to load conversations. Please try again.',
        { supabase_error: conversationError }
      );
    }

    // Step 3: Transform data to include other participant and unread count
    const conversations: DMConversation[] = await Promise.all(
      (conversationData || []).map(async (conv: any) => {
        // Get participants for this conversation
        const { data: participants } = await supabase
          .from('conversation_participants')
          .select('user_id, last_read_at')
          .eq('conversation_id', conv.id);

        const otherParticipant = participants?.find((p: any) => p.user_id !== userId);

        // Get other participant's user info from public.users table
        let otherParticipantInfo = {
          id: '',
          username: 'Unknown',
          displayname: 'Unknown User'
        };

        if (otherParticipant?.user_id) {
          const { data: userData } = await supabase
            .from('users')
            .select('id, username, displayname')
            .eq('id', otherParticipant.user_id)
            .single();

          if (userData) {
            otherParticipantInfo = {
              id: userData.id,
              username: userData.username || '',
              displayname: userData.displayname || ''
            };
          }
        }

        // Get last message
        const { data: lastMessageData } = await supabase
          .from('direct_messages')
          .select('content, sent_at, sender_id')
          .eq('conversation_id', conv.id)
          .eq('is_deleted', false)
          .order('sent_at', { ascending: false })
          .limit(1);

        // Get unread count
        const unreadCount = await getUnreadMessageCount(conv.id, userId);

        return {
          id: conv.id,
          store_id: conv.store_id,
          created_at: conv.created_at,
          updated_at: conv.updated_at,
          other_participant: otherParticipantInfo,
          last_message: lastMessageData?.[0] ? {
            content: lastMessageData[0].content,
            sent_at: lastMessageData[0].sent_at,
            sender_id: lastMessageData[0].sender_id
          } : undefined,
          unread_count: unreadCount
        };
      })
    );

    return {
      conversations,
      total_count: count || 0
    };

  } catch (error) {
    if (error instanceof Error && (error as any).code) {
      throw error; // Re-throw formatted errors
    }

    console.error('Unexpected error in getUserConversations:', error);
    throw formatMessagingError(
      ERROR_CODES.NETWORK_ERROR,
      'An unexpected error occurred while loading conversations.'
    );
  }
}

// =========================
// Message History Retrieval
// =========================

/**
 * Get messages for a conversation with pagination
 */
export async function getConversationMessages(
  conversationId: string,
  userId: string,
  limit: number = 50,
  beforeMessageId?: string
): Promise<MessageHistoryResponse> {
  try {
    // 1. Verify user is participant in conversation
    const { data: participant } = await supabase
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .single();

    if (!participant) {
      throw formatMessagingError(
        ERROR_CODES.PERMISSION_DENIED,
        'You are not authorized to view messages in this conversation.',
        { conversation_id: conversationId, user_id: userId }
      );
    }

    // 2. Build query with optional cursor-based pagination
    let query = supabase
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
      .eq('conversation_id', conversationId)
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
    if (error) {
      console.error('Error getting conversation messages:', error);
      throw formatMessagingError(
        ERROR_CODES.NETWORK_ERROR,
        'Failed to load messages. Please try again.',
        { supabase_error: error }
      );
    }

    // Transform messages and fetch sender information separately
    const messagesSlice = (data || []).slice(0, limit).reverse();
    const transformedMessages: DMMessage[] = await Promise.all(
      messagesSlice.map(async (msg: any) => {
        // Get sender info from public.users table
        const { data: senderData } = await supabase
          .from('users')
          .select('username, displayname')
          .eq('id', msg.sender_id)
          .single();

        // Get replied message info if this is a reply
        let repliedMessage = undefined;
        if (msg.reply_to_id) {
          const { data: originalMsg } = await supabase
            .from('direct_messages')
            .select(`
              id,
              content,
              sender_id
            `)
            .eq('id', msg.reply_to_id)
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

        return {
          id: msg.id,
          conversation_id: msg.conversation_id,
          sender_id: msg.sender_id,
          content: msg.content,
          sent_at: msg.sent_at,
          is_deleted: msg.is_deleted,
          reply_to_id: msg.reply_to_id,
          replied_message: repliedMessage,
          sender: {
            username: senderData?.username || '',
            displayname: senderData?.displayname || ''
          }
        };
      })
    );

    const hasMore = (data || []).length > limit;
    const nextCursor = hasMore ? data?.[limit]?.id : undefined;

    // 3. Mark messages as read
    await supabase
      .from('conversation_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('user_id', userId);

    return {
      messages: transformedMessages,
      has_more: hasMore,
      next_cursor: nextCursor
    };

  } catch (error) {
    if (error instanceof Error && (error as any).code) {
      throw error; // Re-throw formatted errors
    }

    console.error('Unexpected error in getConversationMessages:', error);
    throw formatMessagingError(
      ERROR_CODES.NETWORK_ERROR,
      'An unexpected error occurred while loading messages.'
    );
  }
}

// =========================
// Advanced Query Functions
// =========================

/**
 * Search messages within a conversation
 */
export async function searchConversationMessages(
  conversationId: string,
  userId: string,
  searchTerm: string,
  limit: number = 20
): Promise<DMMessage[]> {
  try {
    // Verify user is participant
    const { data: participant } = await supabase
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .single();

    if (!participant) {
      throw formatMessagingError(
        ERROR_CODES.PERMISSION_DENIED,
        'You are not authorized to search messages in this conversation.'
      );
    }

    const { data, error } = await supabase
      .from('direct_messages')
      .select(`
        id,
        conversation_id,
        sender_id,
        content,
        sent_at,
        is_deleted
      `)
      .eq('conversation_id', conversationId)
      .eq('is_deleted', false)
      .ilike('content', `%${searchTerm}%`)
      .order('sent_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error searching messages:', error);
      throw formatMessagingError(
        ERROR_CODES.NETWORK_ERROR,
        'Failed to search messages. Please try again.'
      );
    }

    // Transform search results and fetch sender information separately
    const transformedMessages: DMMessage[] = await Promise.all(
      (data || []).map(async (msg: any) => {
        // Get sender info from public.users table
        const { data: senderData } = await supabase
          .from('users')
          .select('username, displayname')
          .eq('id', msg.sender_id)
          .single();

        return {
          id: msg.id,
          conversation_id: msg.conversation_id,
          sender_id: msg.sender_id,
          content: msg.content,
          sent_at: msg.sent_at,
          is_deleted: msg.is_deleted,
          sender: {
            username: senderData?.username || '',
            displayname: senderData?.displayname || ''
          }
        };
      })
    );

    return transformedMessages;

  } catch (error) {
    if (error instanceof Error && (error as any).code) {
      throw error;
    }

    console.error('Unexpected error in searchConversationMessages:', error);
    throw formatMessagingError(
      ERROR_CODES.NETWORK_ERROR,
      'An unexpected error occurred while searching messages.'
    );
  }
}

/**
 * Get conversation statistics for analytics
 */
export async function getConversationStats(
  conversationId: string,
  userId: string
): Promise<{
  total_messages: number;
  messages_by_user: Record<string, number>;
  first_message_date: string | null;
  last_message_date: string | null;
}> {
  try {
    // Verify user is participant
    const { data: participant } = await supabase
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .single();

    if (!participant) {
      throw formatMessagingError(
        ERROR_CODES.PERMISSION_DENIED,
        'You are not authorized to view statistics for this conversation.'
      );
    }

    // Get message statistics
    const { data: messages, error } = await supabase
      .from('direct_messages')
      .select('sender_id, sent_at')
      .eq('conversation_id', conversationId)
      .eq('is_deleted', false)
      .order('sent_at', { ascending: true });

    if (error) {
      console.error('Error getting conversation stats:', error);
      throw formatMessagingError(
        ERROR_CODES.NETWORK_ERROR,
        'Failed to load conversation statistics.'
      );
    }

    const messagesByUser: Record<string, number> = {};
    messages?.forEach(msg => {
      messagesByUser[msg.sender_id] = (messagesByUser[msg.sender_id] || 0) + 1;
    });

    return {
      total_messages: messages?.length || 0,
      messages_by_user: messagesByUser,
      first_message_date: messages?.[0]?.sent_at || null,
      last_message_date: messages?.[messages.length - 1]?.sent_at || null
    };

  } catch (error) {
    if (error instanceof Error && (error as any).code) {
      throw error;
    }

    console.error('Unexpected error in getConversationStats:', error);
    throw formatMessagingError(
      ERROR_CODES.NETWORK_ERROR,
      'An unexpected error occurred while loading conversation statistics.'
    );
  }
}
