/**
 * Data Retrieval Utilities
 * 
 * Shared utility functions for data retrieval operations
 */

import { supabase } from '@/lib/supabase';

/**
 * Check if user is participant in a conversation
 */
export async function isUserParticipant(
  conversationId: string,
  userId: string
): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .single();

    return !!data;
  } catch (error) {
    console.error('Error checking user participation:', error);
    return false;
  }
}

/**
 * Get conversation participants
 */
export async function getConversationParticipants(
  conversationId: string
): Promise<Array<{
  user_id: string;
  username: string;
  displayname: string;
  last_read_at: string | null;
}>> {
  try {
    const { data: participants } = await supabase
      .from('conversation_participants')
      .select('user_id, last_read_at')
      .eq('conversation_id', conversationId);

    if (!participants) {
      return [];
    }

    // Get user info for each participant
    const participantsWithInfo = await Promise.all(
      participants.map(async (participant: any) => {
        const { data: userData } = await supabase
          .from('users')
          .select('username, displayname')
          .eq('id', participant.user_id)
          .single();

        return {
          user_id: participant.user_id,
          username: userData?.username || '',
          displayname: userData?.displayname || '',
          last_read_at: participant.last_read_at
        };
      })
    );

    return participantsWithInfo;
  } catch (error) {
    console.error('Error getting conversation participants:', error);
    return [];
  }
}

/**
 * Get user info by ID
 */
export async function getUserInfo(userId: string): Promise<{
  id: string;
  username: string;
  displayname: string;
} | null> {
  try {
    const { data } = await supabase
      .from('users')
      .select('id, username, displayname')
      .eq('id', userId)
      .single();

    return data ? {
      id: data.id,
      username: data.username || '',
      displayname: data.displayname || ''
    } : null;
  } catch (error) {
    console.error('Error getting user info:', error);
    return null;
  }
}

/**
 * Get multiple users info by IDs
 */
export async function getUsersInfo(userIds: string[]): Promise<Record<string, {
  id: string;
  username: string;
  displayname: string;
}>> {
  try {
    if (userIds.length === 0) {
      return {};
    }

    const { data } = await supabase
      .from('users')
      .select('id, username, displayname')
      .in('id', userIds);

    const usersMap: Record<string, any> = {};
    data?.forEach((user: any) => {
      usersMap[user.id] = {
        id: user.id,
        username: user.username || '',
        displayname: user.displayname || ''
      };
    });

    return usersMap;
  } catch (error) {
    console.error('Error getting users info:', error);
    return {};
  }
}

/**
 * Get conversation's last message
 */
export async function getLastMessage(conversationId: string): Promise<{
  content: string;
  sent_at: string;
  sender_id: string;
} | null> {
  try {
    const { data } = await supabase
      .from('direct_messages')
      .select('content, sent_at, sender_id')
      .eq('conversation_id', conversationId)
      .eq('is_deleted', false)
      .order('sent_at', { ascending: false })
      .limit(1)
      .single();

    return data || null;
  } catch (error) {
    console.error('Error getting last message:', error);
    return null;
  }
}

/**
 * Count total messages in conversation
 */
export async function getMessageCount(
  conversationId: string,
  includeDeleted: boolean = false
): Promise<number> {
  try {
    let query = supabase
      .from('direct_messages')
      .select('id', { count: 'exact' })
      .eq('conversation_id', conversationId);

    if (!includeDeleted) {
      query = query.eq('is_deleted', false);
    }

    const { count } = await query;
    return count || 0;
  } catch (error) {
    console.error('Error getting message count:', error);
    return 0;
  }
}

/**
 * Get conversation creation date
 */
export async function getConversationCreatedAt(conversationId: string): Promise<string | null> {
  try {
    const { data } = await supabase
      .from('conversations')
      .select('created_at')
      .eq('id', conversationId)
      .single();

    return data?.created_at || null;
  } catch (error) {
    console.error('Error getting conversation creation date:', error);
    return null;
  }
}

/**
 * Check if conversation exists
 */
export async function conversationExists(conversationId: string): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .single();

    return !!data;
  } catch (error) {
    return false;
  }
}

/**
 * Get conversation store context
 */
export async function getConversationStoreId(conversationId: string): Promise<string | null> {
  try {
    const { data } = await supabase
      .from('conversations')
      .select('store_id')
      .eq('id', conversationId)
      .single();

    return data?.store_id || null;
  } catch (error) {
    console.error('Error getting conversation store ID:', error);
    return null;
  }
}

/**
 * Batch fetch sender information for messages
 */
export async function batchGetSenderInfo(
  messages: Array<{ sender_id: string }>
): Promise<Record<string, { username: string; displayname: string }>> {
  try {
    const senderIds = [...new Set(messages.map(msg => msg.sender_id))];
    
    if (senderIds.length === 0) {
      return {};
    }

    const { data } = await supabase
      .from('users')
      .select('id, username, displayname')
      .in('id', senderIds);

    const sendersMap: Record<string, any> = {};
    data?.forEach((user: any) => {
      sendersMap[user.id] = {
        username: user.username || '',
        displayname: user.displayname || ''
      };
    });

    return sendersMap;
  } catch (error) {
    console.error('Error batch getting sender info:', error);
    return {};
  }
}
