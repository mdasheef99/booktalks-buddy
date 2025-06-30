/**
 * Username Resolution Service
 * Provides utilities to convert user IDs to usernames for profile routing standardization
 */

import { supabase } from '@/lib/supabase';

interface UserLookup {
  id: string;
  username: string;
}

// Cache for user ID to username mappings
const usernameCache = new Map<string, string>();

/**
 * Get username by user ID with caching
 */
export async function getUsernameById(userId: string): Promise<string | null> {
  // Check cache first
  if (usernameCache.has(userId)) {
    return usernameCache.get(userId) || null;
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select('username')
      .eq('id', userId)
      .single();

    if (error || !data?.username) {
      console.error('Error fetching username for user ID:', userId, error);
      return null;
    }

    // Cache the result
    usernameCache.set(userId, data.username);
    return data.username;
  } catch (error) {
    console.error('Error in getUsernameById:', error);
    return null;
  }
}

/**
 * Get user ID by username with caching
 */
export async function getUserIdByUsername(username: string): Promise<string | null> {
  // Check reverse cache
  for (const [id, cachedUsername] of usernameCache.entries()) {
    if (cachedUsername === username) {
      return id;
    }
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .single();

    if (error || !data?.id) {
      console.error('Error fetching user ID for username:', username, error);
      return null;
    }

    // Cache the result
    usernameCache.set(data.id, username);
    return data.id;
  } catch (error) {
    console.error('Error in getUserIdByUsername:', error);
    return null;
  }
}

/**
 * Batch fetch usernames for multiple user IDs
 */
export async function getUsernamesByIds(userIds: string[]): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  const uncachedIds: string[] = [];

  // Check cache for existing mappings
  for (const userId of userIds) {
    if (usernameCache.has(userId)) {
      const username = usernameCache.get(userId);
      if (username) {
        result.set(userId, username);
      }
    } else {
      uncachedIds.push(userId);
    }
  }

  // Fetch uncached usernames
  if (uncachedIds.length > 0) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username')
        .in('id', uncachedIds);

      if (error) {
        console.error('Error batch fetching usernames:', error);
        return result;
      }

      // Process results and update cache
      data?.forEach((user: UserLookup) => {
        if (user.username) {
          result.set(user.id, user.username);
          usernameCache.set(user.id, user.username);
        }
      });
    } catch (error) {
      console.error('Error in getUsernamesByIds:', error);
    }
  }

  return result;
}

/**
 * Clear the username cache (useful for testing or when user data changes)
 */
export function clearUsernameCache(): void {
  usernameCache.clear();
}

/**
 * Generate standardized profile URL for a user
 */
export function generateProfileUrl(username: string): string {
  return `/user/${username}`;
}

/**
 * Generate standardized profile URL by user ID (requires async lookup)
 */
export async function generateProfileUrlById(userId: string): Promise<string | null> {
  const username = await getUsernameById(userId);
  if (!username) {
    return null;
  }
  return generateProfileUrl(username);
}

/**
 * Check if a URL is a legacy profile URL pattern
 */
export function isLegacyProfileUrl(url: string): boolean {
  return /^\/profile\/[a-f0-9-]{36}$/i.test(url);
}

/**
 * Extract user ID from legacy profile URL
 */
export function extractUserIdFromLegacyUrl(url: string): string | null {
  const match = url.match(/^\/profile\/([a-f0-9-]{36})$/i);
  return match ? match[1] : null;
}
