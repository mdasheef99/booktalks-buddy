/**
 * Conversation Helpers Module
 * 
 * Handles conversation-related utility functions and operations
 */

import { supabase } from '@/lib/supabase';
import type { MessagingUser } from '../types';

/**
 * Check if conversation exists between two users
 * Prevents duplicate conversations
 */
export async function findExistingConversation(
  userId1: string,
  userId2: string,
  storeId: string
): Promise<string | null> {
  try {
    // Step 1: Get all conversations where userId1 is a participant
    const { data: user1Conversations, error: error1 } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', userId1);

    if (error1 || !user1Conversations || user1Conversations.length === 0) {
      return null;
    }

    // Step 2: Get all conversations where userId2 is a participant
    const { data: user2Conversations, error: error2 } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', userId2);

    if (error2 || !user2Conversations || user2Conversations.length === 0) {
      return null;
    }

    // Step 3: Find common conversation IDs
    const user1ConversationIds = new Set(user1Conversations.map(c => c.conversation_id));
    const user2ConversationIds = new Set(user2Conversations.map(c => c.conversation_id));

    const commonConversationIds = [...user1ConversationIds].filter(id =>
      user2ConversationIds.has(id)
    );

    if (commonConversationIds.length === 0) {
      return null;
    }

    // Step 4: Verify the conversation is in the correct store
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id')
      .eq('store_id', storeId)
      .in('id', commonConversationIds)
      .limit(1)
      .single();

    return convError ? null : conversation?.id || null;
  } catch (error) {
    console.error('Error finding existing conversation:', error);
    return null;
  }
}

/**
 * Check if user is participant in conversation
 */
export async function isUserInConversation(
  userId: string,
  conversationId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .single();

    return !error && !!data;
  } catch (error) {
    console.error('Error checking if user is in conversation:', error);
    return false;
  }
}

/**
 * Calculate unread message count for a conversation
 * Used for UI indicators
 */
export async function getUnreadMessageCount(
  conversationId: string,
  userId: string
): Promise<number> {
  try {
    // Get user's last read timestamp
    const { data: participant } = await supabase
      .from('conversation_participants')
      .select('last_read_at')
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .single();

    if (!participant) {
      return 0;
    }

    // Count messages sent after last read time
    const { count } = await supabase
      .from('direct_messages')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', conversationId)
      .eq('is_deleted', false)
      .gt('sent_at', participant.last_read_at)
      .neq('sender_id', userId); // Don't count own messages

    return count || 0;
  } catch (error) {
    console.error('Error getting unread message count:', error);
    return 0;
  }
}

/**
 * Generate conversation display name for UI
 */
export function getConversationDisplayName(
  participants: MessagingUser[],
  currentUserId: string
): string {
  const otherParticipants = participants.filter(p => p.id !== currentUserId);

  if (otherParticipants.length === 0) {
    return 'You';
  }

  if (otherParticipants.length === 1) {
    return otherParticipants[0].displayname || otherParticipants[0].username;
  }

  // For group conversations (future feature)
  return otherParticipants
    .map(p => p.displayname || p.username)
    .join(', ');
}
