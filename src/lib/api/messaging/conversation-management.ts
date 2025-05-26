/**
 * Direct Messaging System - Conversation Management
 *
 * This module handles conversation creation, management, and related operations
 * including starting new conversations, getting conversation details, and marking as read.
 */

import { supabase } from '@/lib/supabase';
import {
  StartConversationResponse,
  ERROR_CODES
} from './types';
import {
  requireMessagingPermission
} from './permissions';
import {
  getUserStoreId,
  findUserInStore,
  findExistingConversation,
  formatMessagingError
} from './utils';

// =========================
// Conversation Creation
// =========================

/**
 * Start a new conversation or return existing one
 * Only Privileged/Privileged+ members can initiate conversations
 */
export async function startConversation(
  initiatorId: string,
  recipientUsername: string
): Promise<StartConversationResponse> {
  try {
    // 1. Validate permission to initiate conversations
    await requireMessagingPermission(initiatorId, 'initiate');

    // 2. Get store context for initiator
    const storeId = await getUserStoreId(initiatorId);
    if (!storeId) {
      throw formatMessagingError(
        ERROR_CODES.STORE_CONTEXT_ERROR,
        'Unable to determine store context. Please ensure you are a member of a book club.'
      );
    }

    // 3. Find recipient in same store
    const recipient = await findUserInStore(initiatorId, recipientUsername);
    if (!recipient) {
      throw formatMessagingError(
        ERROR_CODES.USER_NOT_FOUND,
        'User not found in your store. You can only message members of your book clubs.',
        { username: recipientUsername, store_id: storeId }
      );
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

    if (convError) {
      console.error('Error creating conversation:', convError);

      // Provide more specific error messages based on the error
      if (convError.code === '42501') {
        throw formatMessagingError(
          ERROR_CODES.PERMISSION_DENIED,
          'You do not have permission to create conversations. Please check your account status.',
          { supabase_error: convError }
        );
      }

      throw formatMessagingError(
        ERROR_CODES.NETWORK_ERROR,
        'Failed to create conversation. Please try again.',
        { supabase_error: convError }
      );
    }

    // 6. Add participants
    const { error: participantsError } = await supabase
      .from('conversation_participants')
      .insert([
        { conversation_id: conversation.id, user_id: initiatorId },
        { conversation_id: conversation.id, user_id: recipient.id }
      ]);

    if (participantsError) {
      console.error('Error adding participants:', participantsError);
      // Clean up the conversation if participant addition fails
      await supabase.from('conversations').delete().eq('id', conversation.id);

      throw formatMessagingError(
        ERROR_CODES.NETWORK_ERROR,
        'Failed to set up conversation participants. Please try again.',
        { supabase_error: participantsError }
      );
    }

    return {
      conversation_id: conversation.id,
      is_existing: false
    };

  } catch (error) {
    if (error instanceof Error && (error as any).code) {
      throw error; // Re-throw formatted errors
    }

    console.error('Unexpected error in startConversation:', error);
    throw formatMessagingError(
      ERROR_CODES.NETWORK_ERROR,
      'An unexpected error occurred while starting the conversation.'
    );
  }
}

// =========================
// Conversation Details
// =========================

/**
 * Get conversation details including participants
 */
export async function getConversationDetails(
  conversationId: string,
  userId: string
): Promise<{
  id: string;
  store_id: string;
  created_at: string;
  participants: Array<{
    id: string;
    username: string;
    displayname: string;
    joined_at: string;
  }>;
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
        'You are not authorized to view this conversation.',
        { conversation_id: conversationId, user_id: userId }
      );
    }

    // Get conversation details
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        id,
        store_id,
        created_at,
        participants:conversation_participants(
          joined_at,
          user:users(id, username, displayname)
        )
      `)
      .eq('id', conversationId)
      .single();

    if (error) {
      console.error('Error getting conversation details:', error);
      throw formatMessagingError(
        ERROR_CODES.NETWORK_ERROR,
        'Failed to load conversation details.',
        { supabase_error: error }
      );
    }

    return {
      id: data.id,
      store_id: data.store_id,
      created_at: data.created_at,
      participants: data.participants.map(p => ({
        id: p.user.id,
        username: p.user.username,
        displayname: p.user.displayname,
        joined_at: p.joined_at
      }))
    };

  } catch (error) {
    if (error instanceof Error && (error as any).code) {
      throw error;
    }

    console.error('Unexpected error in getConversationDetails:', error);
    throw formatMessagingError(
      ERROR_CODES.NETWORK_ERROR,
      'An unexpected error occurred while loading conversation details.'
    );
  }
}

// =========================
// Conversation State Management
// =========================

/**
 * Mark conversation as read for a user
 */
export async function markConversationAsRead(
  conversationId: string,
  userId: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('conversation_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error marking conversation as read:', error);
      throw formatMessagingError(
        ERROR_CODES.NETWORK_ERROR,
        'Failed to mark conversation as read.',
        { supabase_error: error }
      );
    }
  } catch (error) {
    if (error instanceof Error && (error as any).code) {
      throw error;
    }

    console.error('Unexpected error in markConversationAsRead:', error);
    throw formatMessagingError(
      ERROR_CODES.NETWORK_ERROR,
      'An unexpected error occurred while marking conversation as read.'
    );
  }
}
