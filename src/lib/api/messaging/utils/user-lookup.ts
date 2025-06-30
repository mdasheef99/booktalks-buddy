/**
 * User Lookup Module
 * 
 * Handles user search and lookup operations within store boundaries
 */

import { supabase } from '@/lib/supabase';
import type { MessagingUser } from '../types';
import { getUserStoreId } from './store-context';

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
