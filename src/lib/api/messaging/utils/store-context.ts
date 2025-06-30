/**
 * Store Context Module
 * 
 * Handles store context resolution and store boundary enforcement
 */

import { supabase } from '@/lib/supabase';
import type { StoreContext } from '../types';

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
