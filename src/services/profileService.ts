import { supabase } from '@/lib/supabase';

export interface UserProfile {
  id: string;
  username: string | null;
  email: string | null;
  avatar_url: string | null;
  favorite_author: string | null;
  favorite_genre: string | null;
  bio: string | null;
}

// In-memory cache for profiles
const profileCache: Record<string, UserProfile> = {};
const pendingFetches: Record<string, Promise<UserProfile | null>> = {};

/**
 * Get a single user profile by ID
 * @param userId User ID
 * @returns User profile or null if not found
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  // Check cache first
  if (profileCache[userId]) {
    return profileCache[userId];
  }

  // Check if there's already a pending fetch for this user
  if (pendingFetches[userId]) {
    return pendingFetches[userId];
  }

  // Create a new fetch promise
  const fetchPromise = fetchSingleProfile(userId);
  pendingFetches[userId] = fetchPromise;

  try {
    const profile = await fetchPromise;
    // Cache the result
    if (profile) {
      profileCache[userId] = profile;
    }
    return profile;
  } finally {
    // Clean up pending fetch
    delete pendingFetches[userId];
  }
}

/**
 * Get multiple user profiles by IDs
 * @param userIds Array of user IDs
 * @returns Map of user ID to profile
 */
export async function getUserProfiles(userIds: string[]): Promise<Map<string, UserProfile>> {
  if (!userIds.length) return new Map();

  // Deduplicate user IDs
  const uniqueIds = Array.from(new Set(userIds));
  
  // Check which IDs are already in cache
  const result = new Map<string, UserProfile>();
  const idsToFetch: string[] = [];
  
  uniqueIds.forEach(id => {
    if (profileCache[id]) {
      result.set(id, profileCache[id]);
    } else {
      idsToFetch.push(id);
    }
  });
  
  // If all profiles are cached, return immediately
  if (idsToFetch.length === 0) {
    return result;
  }
  
  // Fetch missing profiles in batch
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, email, avatar_url, favorite_author, favorite_genre, bio')
      .in('id', idsToFetch);
      
    if (error) throw error;
    
    // Add fetched profiles to cache and result
    data?.forEach(profile => {
      profileCache[profile.id] = profile;
      result.set(profile.id, profile);
    });
    
    // Add placeholder for missing profiles
    idsToFetch.forEach(id => {
      if (!result.has(id)) {
        const placeholder: UserProfile = {
          id,
          username: 'Unknown User',
          email: null,
          avatar_url: null,
          favorite_author: null,
          favorite_genre: null,
          bio: null
        };
        profileCache[id] = placeholder;
        result.set(id, placeholder);
      }
    });
    
    return result;
  } catch (error) {
    console.error('Error fetching user profiles:', error);
    
    // Return placeholders for all unfetched IDs
    idsToFetch.forEach(id => {
      if (!result.has(id)) {
        const placeholder: UserProfile = {
          id,
          username: 'Unknown User',
          email: null,
          avatar_url: null,
          favorite_author: null,
          favorite_genre: null,
          bio: null
        };
        result.set(id, placeholder);
      }
    });
    
    return result;
  }
}

/**
 * Clear the profile cache
 */
export function clearProfileCache(): void {
  Object.keys(profileCache).forEach(key => {
    delete profileCache[key];
  });
}

/**
 * Helper function to fetch a single profile
 */
async function fetchSingleProfile(userId: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, email, avatar_url, favorite_author, favorite_genre, bio')
      .eq('id', userId)
      .single();
      
    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        return null;
      }
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error(`Error fetching profile for user ${userId}:`, error);
    return null;
  }
}
