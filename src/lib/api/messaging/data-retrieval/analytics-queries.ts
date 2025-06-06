/**
 * Analytics Queries Module
 * 
 * Handles conversation statistics and analytics operations
 */

import { supabase } from '@/lib/supabase';
import { formatMessagingError } from '../utils';
import type { ERROR_CODES, ConversationStatsResult } from './types';

/**
 * Get conversation statistics for analytics
 */
export async function getConversationStats(
  conversationId: string,
  userId: string
): Promise<ConversationStatsResult> {
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
        'NETWORK_ERROR' as ERROR_CODES,
        'Failed to load conversation statistics.'
      );
    }

    const messagesByUser: Record<string, number> = {};
    messages?.forEach((msg: any) => {
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
      'NETWORK_ERROR' as ERROR_CODES,
      'An unexpected error occurred while loading conversation statistics.'
    );
  }
}

/**
 * Get user's messaging activity statistics
 */
export async function getUserMessagingStats(
  userId: string,
  days: number = 30
): Promise<{
  total_conversations: number;
  total_messages_sent: number;
  total_messages_received: number;
  active_conversations: number;
  average_response_time_hours: number | null;
}> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get user's conversations
    const { data: participantData } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', userId);

    const conversationIds = participantData?.map((p: any) => p.conversation_id) || [];

    if (conversationIds.length === 0) {
      return {
        total_conversations: 0,
        total_messages_sent: 0,
        total_messages_received: 0,
        active_conversations: 0,
        average_response_time_hours: null
      };
    }

    // Get messages in the time period
    const { data: messages } = await supabase
      .from('direct_messages')
      .select('sender_id, conversation_id, sent_at')
      .in('conversation_id', conversationIds)
      .gte('sent_at', startDate.toISOString())
      .eq('is_deleted', false)
      .order('sent_at', { ascending: true });

    const messagesSent = messages?.filter((msg: any) => msg.sender_id === userId).length || 0;
    const messagesReceived = messages?.filter((msg: any) => msg.sender_id !== userId).length || 0;
    
    // Count active conversations (conversations with messages in the period)
    const activeConversationIds = new Set(messages?.map((msg: any) => msg.conversation_id));

    return {
      total_conversations: conversationIds.length,
      total_messages_sent: messagesSent,
      total_messages_received: messagesReceived,
      active_conversations: activeConversationIds.size,
      average_response_time_hours: null // Simplified for now
    };

  } catch (error) {
    console.error('Error getting user messaging stats:', error);
    return {
      total_conversations: 0,
      total_messages_sent: 0,
      total_messages_received: 0,
      active_conversations: 0,
      average_response_time_hours: null
    };
  }
}

/**
 * Get conversation activity timeline
 */
export async function getConversationTimeline(
  conversationId: string,
  userId: string,
  days: number = 7
): Promise<Array<{
  date: string;
  message_count: number;
  user_messages: number;
  other_messages: number;
}>> {
  try {
    // Verify user is participant
    const { data: participant } = await supabase
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .single();

    if (!participant) {
      return [];
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get messages in the time period
    const { data: messages } = await supabase
      .from('direct_messages')
      .select('sender_id, sent_at')
      .eq('conversation_id', conversationId)
      .gte('sent_at', startDate.toISOString())
      .eq('is_deleted', false)
      .order('sent_at', { ascending: true });

    // Group messages by date
    const messagesByDate: Record<string, { user: number; other: number }> = {};
    
    messages?.forEach((msg: any) => {
      const date = new Date(msg.sent_at).toISOString().split('T')[0];
      if (!messagesByDate[date]) {
        messagesByDate[date] = { user: 0, other: 0 };
      }
      
      if (msg.sender_id === userId) {
        messagesByDate[date].user++;
      } else {
        messagesByDate[date].other++;
      }
    });

    // Convert to timeline format
    const timeline = Object.entries(messagesByDate).map(([date, counts]) => ({
      date,
      message_count: counts.user + counts.other,
      user_messages: counts.user,
      other_messages: counts.other
    }));

    return timeline.sort((a, b) => a.date.localeCompare(b.date));

  } catch (error) {
    console.error('Error getting conversation timeline:', error);
    return [];
  }
}

/**
 * Get most active conversations for a user
 */
export async function getMostActiveConversations(
  userId: string,
  limit: number = 5,
  days: number = 30
): Promise<Array<{
  conversation_id: string;
  message_count: number;
  last_activity: string;
  other_participant_username: string;
}>> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get user's conversations
    const { data: participantData } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', userId);

    const conversationIds = participantData?.map((p: any) => p.conversation_id) || [];

    if (conversationIds.length === 0) {
      return [];
    }

    // Get message counts per conversation
    const { data: messages } = await supabase
      .from('direct_messages')
      .select('conversation_id, sent_at')
      .in('conversation_id', conversationIds)
      .gte('sent_at', startDate.toISOString())
      .eq('is_deleted', false);

    // Count messages per conversation
    const conversationStats: Record<string, { count: number; lastActivity: string }> = {};
    
    messages?.forEach((msg: any) => {
      const convId = msg.conversation_id;
      if (!conversationStats[convId]) {
        conversationStats[convId] = { count: 0, lastActivity: msg.sent_at };
      }
      conversationStats[convId].count++;
      if (msg.sent_at > conversationStats[convId].lastActivity) {
        conversationStats[convId].lastActivity = msg.sent_at;
      }
    });

    // Get top conversations and their participant info
    const topConversations = Object.entries(conversationStats)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, limit);

    const result = await Promise.all(
      topConversations.map(async ([conversationId, stats]) => {
        // Get other participant info
        const { data: participants } = await supabase
          .from('conversation_participants')
          .select('user_id')
          .eq('conversation_id', conversationId);

        const otherParticipantId = participants?.find((p: any) => p.user_id !== userId)?.user_id;
        
        let otherParticipantUsername = 'Unknown';
        if (otherParticipantId) {
          const { data: userData } = await supabase
            .from('users')
            .select('username')
            .eq('id', otherParticipantId)
            .single();
          
          otherParticipantUsername = userData?.username || 'Unknown';
        }

        return {
          conversation_id: conversationId,
          message_count: stats.count,
          last_activity: stats.lastActivity,
          other_participant_username: otherParticipantUsername
        };
      })
    );

    return result;

  } catch (error) {
    console.error('Error getting most active conversations:', error);
    return [];
  }
}
