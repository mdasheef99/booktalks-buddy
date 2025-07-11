/**
 * User Context Service Module
 * 
 * User store context resolution and club membership logic
 */

import { supabase } from '@/lib/supabase';
import { validateUserId, throwIfInvalid } from '@/lib/api/books/validation';
import { UserStoreContext } from './types/storeRequests';

// =====================================================
// User Store Context Resolution
// =====================================================

/**
 * Get user's store ID through club membership
 * Users belong to stores via their club memberships
 */
export async function getUserStoreId(userId: string): Promise<string | null> {
  try {
    throwIfInvalid(validateUserId(userId), 'userId');

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
 * Get user's store context including store details
 */
export async function getUserStoreContext(userId: string): Promise<UserStoreContext | null> {
  try {
    throwIfInvalid(validateUserId(userId), 'userId');

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

/**
 * Validate user has store access
 */
export async function validateUserStoreAccess(userId: string): Promise<string> {
  const storeId = await getUserStoreId(userId);
  if (!storeId) {
    throw new Error('You must be a member of a book club to request books from stores');
  }
  return storeId;
}

/**
 * Check if user belongs to a specific store
 */
export async function userBelongsToStore(userId: string, storeId: string): Promise<boolean> {
  try {
    const userStoreId = await getUserStoreId(userId);
    return userStoreId === storeId;
  } catch (error) {
    console.error('Error checking user store membership:', error);
    return false;
  }
}

/**
 * Get user's club information through store context
 */
export async function getUserClubInfo(userId: string): Promise<{
  club_id: string;
  club_name: string;
  store_id: string;
  store_name: string;
} | null> {
  try {
    throwIfInvalid(validateUserId(userId), 'userId');

    const { data, error } = await supabase
      .from('club_members')
      .select(`
        book_clubs!inner(
          id,
          name,
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
      club_id: data.book_clubs.id,
      club_name: data.book_clubs.name,
      store_id: data.book_clubs.store_id,
      store_name: data.book_clubs.stores.name
    };
  } catch (error) {
    console.error('Error getting user club info:', error);
    return null;
  }
}
