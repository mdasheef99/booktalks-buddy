/**
 * Message Queries Module
 * 
 * Handles message fetching, search, and related operations
 */

import { supabase } from '@/lib/supabase';
import { formatMessagingError } from '../utils';
import type { 
  MessageHistoryResponse, 
  DMMessage, 
  ERROR_CODES,
  MessageQueryOptions,
  MessageSearchOptions 
} from './types';

/**
 * Get messages for a conversation with pagination
 */
export async function getConversationMessages(
  options: MessageQueryOptions
): Promise<MessageHistoryResponse> {
  const { conversationId, userId, limit = 50, beforeMessageId } = options;

  // Validate required parameters
  if (!conversationId || typeof conversationId !== 'string') {
    throw formatMessagingError(
      'VALIDATION_ERROR' as ERROR_CODES,
      'Invalid conversation ID provided. Conversation ID must be a valid string.',
      {
        provided_conversationId: conversationId,
        type_of_conversationId: typeof conversationId,
        options_received: options
      }
    );
  }

  if (!userId || typeof userId !== 'string') {
    throw formatMessagingError(
      'VALIDATION_ERROR' as ERROR_CODES,
      'Invalid user ID provided. User ID must be a valid string.',
      {
        provided_userId: userId,
        type_of_userId: typeof userId,
        options_received: options
      }
    );
  }

  // Check if IDs look like valid UUIDs
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(conversationId)) {
    throw formatMessagingError(
      'VALIDATION_ERROR' as ERROR_CODES,
      'Invalid conversation ID format. Conversation ID must be a valid UUID.',
      {
        provided_conversationId: conversationId,
        expected_format: 'UUID (e.g., 123e4567-e89b-12d3-a456-426614174000)'
      }
    );
  }

  if (!uuidRegex.test(userId)) {
    throw formatMessagingError(
      'VALIDATION_ERROR' as ERROR_CODES,
      'Invalid user ID format. User ID must be a valid UUID.',
      {
        provided_userId: userId,
        expected_format: 'UUID (e.g., 123e4567-e89b-12d3-a456-426614174000)'
      }
    );
  }

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
        'PERMISSION_DENIED' as ERROR_CODES,
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
        'NETWORK_ERROR' as ERROR_CODES,
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
      'NETWORK_ERROR' as ERROR_CODES,
      'An unexpected error occurred while loading messages.'
    );
  }
}

/**
 * Search messages within a conversation
 */
export async function searchConversationMessages(
  options: MessageSearchOptions
): Promise<DMMessage[]> {
  const { conversationId, userId, searchTerm, limit = 20 } = options;
  
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
        'PERMISSION_DENIED' as ERROR_CODES,
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
        'NETWORK_ERROR' as ERROR_CODES,
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
      'NETWORK_ERROR' as ERROR_CODES,
      'An unexpected error occurred while searching messages.'
    );
  }
}

/**
 * Get a single message by ID (with permission check)
 */
export async function getMessageById(
  messageId: string,
  userId: string
): Promise<DMMessage | null> {
  try {
    // Get message data
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
      .eq('id', messageId)
      .single();

    if (!messageData) {
      return null;
    }

    // Verify user is participant in the conversation
    const { data: participant } = await supabase
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', messageData.conversation_id)
      .eq('user_id', userId)
      .single();

    if (!participant) {
      return null; // User not authorized to view this message
    }

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

    return {
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

  } catch (error) {
    console.error('Error getting message by ID:', error);
    return null;
  }
}
