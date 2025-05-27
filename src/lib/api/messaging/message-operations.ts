/**
 * Direct Messaging System - Message Operations
 *
 * This module handles message-related operations including sending messages,
 * deleting messages, and other message management functions.
 */

import { supabase } from '@/lib/supabase';
import {
  SendMessageResponse,
  ERROR_CODES
} from './types';
import {
  getUserRetentionPeriod
} from './permissions';
import {
  validateMessageContent,
  formatMessagingError
} from './utils';
import { createNotificationFromTemplate } from '@/lib/api/notifications/operations';

// =========================
// Message Sending
// =========================

/**
 * Send a message in a conversation
 * All conversation participants can send messages
 */
export async function sendMessage(
  senderId: string,
  conversationId: string,
  content: string,
  replyToId?: string
): Promise<SendMessageResponse> {
  try {
    // 1. Validate message content
    const validation = validateMessageContent(content);
    if (!validation.valid) {
      throw formatMessagingError(
        ERROR_CODES.VALIDATION_ERROR,
        validation.error || 'Invalid message content',
        validation.details
      );
    }

    // 2. Check if user is participant in the conversation
    const { data: participant, error: participantError } = await supabase
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', conversationId)
      .eq('user_id', senderId)
      .single();

    if (participantError || !participant) {
      throw formatMessagingError(
        ERROR_CODES.PERMISSION_DENIED,
        'You are not authorized to send messages in this conversation.',
        { conversation_id: conversationId, user_id: senderId }
      );
    }

    // 3. Get retention info for message
    const retentionInfo = await getUserRetentionPeriod(senderId);

    // 4. Insert message with retention policy
    const { data: message, error: messageError } = await supabase
      .from('direct_messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content: content.trim(),
        reply_to_id: replyToId || null,
        retention_expires_at: retentionInfo.expires_at
      })
      .select(`
        id,
        conversation_id,
        sender_id,
        content,
        sent_at,
        is_deleted,
        reply_to_id
      `)
      .single();

    if (messageError) {
      console.error('Error sending message:', messageError);
      throw formatMessagingError(
        ERROR_CODES.NETWORK_ERROR,
        'Failed to send message. Please try again.',
        { supabase_error: messageError }
      );
    }

    // 5. Get sender info
    const { data: senderData } = await supabase
      .from('users')
      .select('username, displayname')
      .eq('id', senderId)
      .single();

    // 6. Get replied message info if this is a reply
    let repliedMessage = undefined;
    if (replyToId) {
      const { data: originalMsg } = await supabase
        .from('direct_messages')
        .select(`
          id,
          content,
          sender_id
        `)
        .eq('id', replyToId)
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

    // 7. Update conversation timestamp for proper ordering
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    // 8. Create notification for other participants
    try {
      // Get other participants (excluding sender)
      const { data: otherParticipants } = await supabase
        .from('conversation_participants')
        .select('user_id')
        .eq('conversation_id', conversationId)
        .neq('user_id', senderId);

      // Create notifications for each participant
      if (otherParticipants && otherParticipants.length > 0) {
        const senderDisplayName = senderData?.displayname || senderData?.username || 'Someone';
        const messagePreview = content.length > 50 ? content.substring(0, 50) + '...' : content;

        for (const participant of otherParticipants) {
          await createNotificationFromTemplate({
            template_name: 'new_message',
            user_id: participant.user_id,
            variables: {
              sender_name: senderDisplayName,
              message_preview: messagePreview
            },
            data: {
              conversation_id: conversationId,
              message_id: message.id,
              sender_id: senderId
            }
          });
        }
      }
    } catch (notificationError) {
      // Don't fail message sending if notification creation fails
      console.warn('Failed to create message notification:', notificationError);
    }

    // 9. Return complete message with all data
    const completeMessage = {
      id: message.id,
      conversation_id: message.conversation_id,
      sender_id: message.sender_id,
      content: message.content,
      sent_at: message.sent_at,
      is_deleted: message.is_deleted,
      reply_to_id: message.reply_to_id,
      replied_message: repliedMessage,
      sender: {
        username: senderData?.username || '',
        displayname: senderData?.displayname || ''
      }
    };

    return completeMessage as SendMessageResponse;

  } catch (error) {
    if (error instanceof Error && (error as any).code) {
      throw error; // Re-throw formatted errors
    }

    console.error('Unexpected error in sendMessage:', error);
    throw formatMessagingError(
      ERROR_CODES.NETWORK_ERROR,
      'An unexpected error occurred while sending the message.'
    );
  }
}

// =========================
// Message Management
// =========================

/**
 * Soft delete a message (user can only delete their own messages)
 */
export async function deleteMessage(
  messageId: string,
  userId: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('direct_messages')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString()
      })
      .eq('id', messageId)
      .eq('sender_id', userId);

    if (error) {
      console.error('Error deleting message:', error);
      throw formatMessagingError(
        ERROR_CODES.NETWORK_ERROR,
        'Failed to delete message. Please try again.',
        { supabase_error: error }
      );
    }
  } catch (error) {
    if (error instanceof Error && (error as any).code) {
      throw error;
    }

    console.error('Unexpected error in deleteMessage:', error);
    throw formatMessagingError(
      ERROR_CODES.NETWORK_ERROR,
      'An unexpected error occurred while deleting the message.'
    );
  }
}

// =========================
// Message Validation & Utilities
// =========================

/**
 * Check if user can edit/delete a specific message
 */
export async function canUserModifyMessage(
  messageId: string,
  userId: string
): Promise<boolean> {
  try {
    const { data: message } = await supabase
      .from('direct_messages')
      .select('sender_id')
      .eq('id', messageId)
      .single();

    return message?.sender_id === userId;
  } catch (error) {
    console.error('Error checking message modification permission:', error);
    return false;
  }
}

/**
 * Get message details for editing/management
 */
export async function getMessageDetails(
  messageId: string,
  userId: string
): Promise<{
  id: string;
  conversation_id: string;
  content: string;
  sent_at: string;
  can_modify: boolean;
} | null> {
  try {
    const { data: message, error } = await supabase
      .from('direct_messages')
      .select(`
        id,
        conversation_id,
        sender_id,
        content,
        sent_at,
        is_deleted
      `)
      .eq('id', messageId)
      .single();

    if (error || !message || message.is_deleted) {
      return null;
    }

    // Verify user is participant in the conversation
    const { data: participant } = await supabase
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', message.conversation_id)
      .eq('user_id', userId)
      .single();

    if (!participant) {
      return null;
    }

    return {
      id: message.id,
      conversation_id: message.conversation_id,
      content: message.content,
      sent_at: message.sent_at,
      can_modify: message.sender_id === userId
    };

  } catch (error) {
    console.error('Error getting message details:', error);
    return null;
  }
}

/**
 * Update conversation timestamp when messages are modified
 * Used internally to maintain proper conversation ordering
 */
export async function updateConversationTimestamp(
  conversationId: string
): Promise<void> {
  try {
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);
  } catch (error) {
    console.error('Error updating conversation timestamp:', error);
    // Non-critical error, don't throw
  }
}
