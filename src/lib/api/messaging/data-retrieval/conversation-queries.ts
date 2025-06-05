/**
 * Conversation Queries Module
 * 
 * Handles conversation list retrieval and related operations
 */

import { supabase } from '@/lib/supabase';
import { getUnreadMessageCount, formatMessagingError } from '../utils';
import { verifyDatabaseTables } from './database-verification';
import type { 
  ConversationListResponse, 
  DMConversation, 
  ERROR_CODES,
  ConversationQueryOptions 
} from './types';

/**
 * Get user's conversations with pagination and unread counts
 */
export async function getUserConversations(
  options: ConversationQueryOptions
): Promise<ConversationListResponse> {
  const { userId, limit = 20, offset = 0 } = options;

  // Validate userId parameter
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

  // Check if userId looks like a valid UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
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
          'NETWORK_ERROR' as ERROR_CODES,
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
          'NETWORK_ERROR' as ERROR_CODES,
          'Database function error. Please ensure all migrations have been applied.',
          {
            supabase_error: participantError,
            suggestion: 'Check that all migration files have been executed in Supabase SQL Editor'
          }
        );
      }

      throw formatMessagingError(
        'NETWORK_ERROR' as ERROR_CODES,
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

    const conversationIds = participantData.map((p: any) => p.conversation_id);

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
        'NETWORK_ERROR' as ERROR_CODES,
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
      'NETWORK_ERROR' as ERROR_CODES,
      'An unexpected error occurred while loading conversations.'
    );
  }
}

/**
 * Get conversation details by ID
 */
export async function getConversationById(
  conversationId: string,
  userId: string
): Promise<DMConversation | null> {
  try {
    // Verify user is participant
    const { data: participant } = await supabase
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .single();

    if (!participant) {
      return null;
    }

    // Get conversation data
    const { data: conversationData } = await supabase
      .from('conversations')
      .select('id, store_id, created_at, updated_at')
      .eq('id', conversationId)
      .single();

    if (!conversationData) {
      return null;
    }

    // Get other participant info (similar to getUserConversations logic)
    const { data: participants } = await supabase
      .from('conversation_participants')
      .select('user_id, last_read_at')
      .eq('conversation_id', conversationId);

    const otherParticipant = participants?.find((p: any) => p.user_id !== userId);
    
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
      .eq('conversation_id', conversationId)
      .eq('is_deleted', false)
      .order('sent_at', { ascending: false })
      .limit(1);

    // Get unread count
    const unreadCount = await getUnreadMessageCount(conversationId, userId);

    return {
      id: conversationData.id,
      store_id: conversationData.store_id,
      created_at: conversationData.created_at,
      updated_at: conversationData.updated_at,
      other_participant: otherParticipantInfo,
      last_message: lastMessageData?.[0] ? {
        content: lastMessageData[0].content,
        sent_at: lastMessageData[0].sent_at,
        sender_id: lastMessageData[0].sender_id
      } : undefined,
      unread_count: unreadCount
    };

  } catch (error) {
    console.error('Error getting conversation by ID:', error);
    return null;
  }
}
