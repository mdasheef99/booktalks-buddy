/**
 * Direct Messaging System - Utility Functions
 *
 * This file contains helper functions for the messaging system including
 * store context resolution, user lookup, and validation utilities.
 */

import { supabase } from '@/lib/supabase';
import { MessagingUser, ValidationResult, StoreContext } from './types';

// =========================
// Store Context Functions
// =========================

/**
 * Get user's store ID through club membership
 * Users belong to stores via their club memberships
 */
export async function getUserStoreId(userId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('club_members')
      .select('book_clubs!inner(store_id)')
      .eq('user_id', userId)
      .limit(1)
      .single();

    if (error || !data) {
      console.warn(`Could not find store context for user ${userId}:`, error);
      return null;
    }

    return data.book_clubs?.store_id || null;
  } catch (error) {
    console.error('Error getting user store ID:', error);
    return null;
  }
}

/**
 * Check if two users are in the same store
 * Essential for enforcing store boundary isolation
 */
export async function areUsersInSameStore(
  userId1: string,
  userId2: string
): Promise<boolean> {
  try {
    const [store1, store2] = await Promise.all([
      getUserStoreId(userId1),
      getUserStoreId(userId2)
    ]);

    return store1 !== null && store1 === store2;
  } catch (error) {
    console.error('Error checking if users are in same store:', error);
    return false;
  }
}

/**
 * Get store context for a user including store details
 */
export async function getUserStoreContext(userId: string): Promise<StoreContext | null> {
  try {
    const { data, error } = await supabase
      .from('club_members')
      .select(`
        book_clubs!inner(
          store_id,
          stores!inner(
            id,
            name
          )
        )
      `)
      .eq('user_id', userId)
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      store_id: data.book_clubs.store_id,
      store_name: data.book_clubs.stores.name
    };
  } catch (error) {
    console.error('Error getting user store context:', error);
    return null;
  }
}

// =========================
// User Lookup Functions
// =========================

/**
 * Search for users within the same store for autocomplete
 * Returns users who can receive direct messages
 */
export async function searchUsersInStore(
  searcherUserId: string,
  searchQuery: string,
  limit: number = 10
): Promise<MessagingUser[]> {
  try {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      return [];
    }

    // Get searcher's store ID
    const searcherStoreId = await getUserStoreId(searcherUserId);
    if (!searcherStoreId) {
      console.warn(`Searcher ${searcherUserId} has no store context`);
      return [];
    }

    // Get all users in the same store who are club members
    // Use a different approach since club_members.user_id references auth.users
    // but we need to query public.users for profile information
    const { data: clubMembers, error: clubError } = await supabase
      .from('club_members')
      .select('user_id')
      .neq('user_id', searcherUserId); // Exclude the searcher

    if (clubError) {
      console.error('Error fetching club members:', clubError);
      return [];
    }

    if (!clubMembers || clubMembers.length === 0) {
      return [];
    }

    // Extract user IDs from club members
    const userIds = clubMembers.map(member => member.user_id);

    // Now query the users table directly with the user IDs
    // Note: allow_direct_messages column might not exist yet, so we'll handle that gracefully
    const { data: storeUsers, error } = await supabase
      .from('users')
      .select('id, username, displayname')
      .in('id', userIds)
      .ilike('username', `%${searchQuery}%`)
      .limit(limit);

    if (error) {
      console.error('Error searching users in store:', error);
      return [];
    }

    if (!storeUsers || storeUsers.length === 0) {
      return [];
    }

    // Filter to unique users and verify they're in the same store
    const uniqueUsers = new Map<string, MessagingUser>();

    for (const user of storeUsers) {
      if (!user || uniqueUsers.has(user.id)) continue;

      // Verify user is in the same store
      const userStoreId = await getUserStoreId(user.id);
      if (userStoreId === searcherStoreId) {
        uniqueUsers.set(user.id, {
          id: user.id,
          username: user.username,
          displayname: user.displayname
        });
      }
    }

    return Array.from(uniqueUsers.values());

  } catch (error) {
    console.error('Error in searchUsersInStore:', error);
    return [];
  }
}

/**
 * Find user by username within the same store
 * Ensures store boundary enforcement for user targeting
 */
export async function findUserInStore(
  searcherUserId: string,
  targetUsername: string
): Promise<MessagingUser | null> {
  try {
    // Get searcher's store ID
    const searcherStoreId = await getUserStoreId(searcherUserId);
    if (!searcherStoreId) {
      console.warn(`Searcher ${searcherUserId} has no store context`);
      return null;
    }

    // Find user by username
    const { data: targetUser, error } = await supabase
      .from('users')
      .select('id, username, displayname')
      .eq('username', targetUsername)
      .single();

    if (error || !targetUser) {
      console.warn(`User not found: ${targetUsername}`, error);
      return null;
    }

    // Verify target user is in same store
    const targetStoreId = await getUserStoreId(targetUser.id);
    if (targetStoreId !== searcherStoreId) {
      console.warn(`User ${targetUsername} not in same store as searcher`);
      return null;
    }

    return {
      id: targetUser.id,
      username: targetUser.username,
      displayname: targetUser.displayname
    };
  } catch (error) {
    console.error('Error finding user in store:', error);
    return null;
  }
}

/**
 * Get multiple users by IDs with store context validation
 */
export async function getUsersInStore(
  userIds: string[],
  storeId: string
): Promise<MessagingUser[]> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, displayname')
      .in('id', userIds);

    if (error || !data) {
      return [];
    }

    // Filter users to only those in the specified store
    const validUsers: MessagingUser[] = [];
    for (const user of data) {
      const userStoreId = await getUserStoreId(user.id);
      if (userStoreId === storeId) {
        validUsers.push({
          id: user.id,
          username: user.username,
          displayname: user.displayname
        });
      }
    }

    return validUsers;
  } catch (error) {
    console.error('Error getting users in store:', error);
    return [];
  }
}

// =========================
// Conversation Functions
// =========================

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

// =========================
// Validation Functions
// =========================

/**
 * Validate message content
 * Ensures content meets requirements and is safe
 */
export function validateMessageContent(content: string): ValidationResult {
  if (!content || typeof content !== 'string') {
    return {
      valid: false,
      error: 'Message content is required',
      details: { provided: typeof content }
    };
  }

  const trimmed = content.trim();
  if (trimmed.length === 0) {
    return {
      valid: false,
      error: 'Message cannot be empty',
      details: { length: trimmed.length }
    };
  }

  if (trimmed.length > 1000) {
    return {
      valid: false,
      error: 'Message too long (maximum 1000 characters)',
      details: { length: trimmed.length, max: 1000 }
    };
  }

  // Basic content validation (can be extended)
  if (trimmed.includes('<script>') || trimmed.includes('javascript:')) {
    return {
      valid: false,
      error: 'Message contains invalid content',
      details: { reason: 'potential_script_injection' }
    };
  }

  return { valid: true };
}

/**
 * Validate username format
 */
export function validateUsername(username: string): ValidationResult {
  if (!username || typeof username !== 'string') {
    return {
      valid: false,
      error: 'Username is required',
      details: { provided: typeof username }
    };
  }

  const trimmed = username.trim();
  if (trimmed.length === 0) {
    return {
      valid: false,
      error: 'Username cannot be empty'
    };
  }

  // Basic username validation (adjust based on your requirements)
  if (trimmed.length < 3 || trimmed.length > 50) {
    return {
      valid: false,
      error: 'Username must be between 3 and 50 characters',
      details: { length: trimmed.length }
    };
  }

  return { valid: true };
}

// =========================
// Utility Functions
// =========================

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
 * Format error for consistent error handling
 */
export function formatMessagingError(
  code: string,
  message: string,
  details?: Record<string, any>
): Error {
  const error = new Error(message);
  (error as any).code = code;
  (error as any).details = details;
  return error;
}

/**
 * Sanitize content for safe display
 * Basic sanitization - can be extended with a proper sanitization library
 */
export function sanitizeContent(content: string): string {
  return content
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
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
