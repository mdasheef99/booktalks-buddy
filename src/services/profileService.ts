import { supabase } from '@/lib/supabase';

export interface UserProfile {
  id: string;
  username: string | null;
  email: string | null;
  avatar_url: string | null; // Legacy field for backward compatibility
  avatar_thumbnail_url: string | null; // 100x100 for navigation/small elements
  avatar_medium_url: string | null; // 300x300 for lists/cards
  avatar_full_url: string | null; // 600x600 for profile pages
  displayname: string | null; // User-customizable display name
  favorite_author: string | null;
  favorite_genre: string | null;
  bio: string | null;
  membership_tier: string | null; // New tier system
}

// Type for profile updates (only updatable fields)
export type ProfileUpdateData = Partial<Pick<UserProfile, 'displayname' | 'bio' | 'favorite_author' | 'favorite_genre' | 'avatar_url' | 'avatar_thumbnail_url' | 'avatar_medium_url' | 'avatar_full_url'>>;

// Type for profile creation
export interface ProfileCreateData {
  id: string;
  username: string;
  email: string;
  displayname?: string | null;
}

// Type for the specific fields we select from the database
type SelectedUserFields = {
  id: string;
  username: string;
  email: string;
  avatar_url: string | null;
  avatar_thumbnail_url?: string | null;
  avatar_medium_url?: string | null;
  avatar_full_url?: string | null;
  displayname: string | null;
  favorite_author: string | null;
  favorite_genre: string | null;
  bio: string | null;
  membership_tier: string;
};



// Helper function to convert selected database fields to UserProfile
function createUserProfileFromDatabaseRow(data: SelectedUserFields): UserProfile {
  return {
    id: data.id,
    username: data.username,
    email: data.email,
    avatar_url: data.avatar_url,
    avatar_thumbnail_url: data.avatar_thumbnail_url || null,
    avatar_medium_url: data.avatar_medium_url || null,
    avatar_full_url: data.avatar_full_url || null,
    displayname: data.displayname,
    favorite_author: data.favorite_author,
    favorite_genre: data.favorite_genre,
    bio: data.bio,
    membership_tier: data.membership_tier
  };
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
    // Fetch user data including all avatar columns (using type assertion since columns exist)
    const { data, error } = await supabase
      .from('users')
      .select('id, username, email, avatar_url, avatar_thumbnail_url, avatar_medium_url, avatar_full_url, displayname, favorite_author, favorite_genre, bio, membership_tier')
      .in('id', idsToFetch) as any;

    if (error) throw error;

    // Add fetched profiles to cache and result
    if (data) {
      data.forEach((profile: any) => {
        const userProfile = createUserProfileFromDatabaseRow(profile);
        profileCache[profile.id] = userProfile;
        result.set(profile.id, userProfile);
      });
    }

    // Add placeholder for missing profiles
    idsToFetch.forEach(id => {
      if (!result.has(id)) {
        const placeholder: UserProfile = {
          id,
          username: 'Unknown User',
          email: null,
          displayname: `User ${id.substring(0, 4)}`,
          avatar_url: null,
          avatar_thumbnail_url: null,
          avatar_medium_url: null,
          avatar_full_url: null,
          favorite_author: null,
          favorite_genre: null,
          bio: null,
          membership_tier: null
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
          displayname: `User ${id.substring(0, 4)}`,
          avatar_url: null,
          avatar_thumbnail_url: null,
          avatar_medium_url: null,
          avatar_full_url: null,
          favorite_author: null,
          favorite_genre: null,
          bio: null,
          membership_tier: null
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
      .select('id, username, email, avatar_url, avatar_thumbnail_url, avatar_medium_url, avatar_full_url, displayname, favorite_author, favorite_genre, bio, membership_tier')
      .eq('id', userId)
      .single() as any;

    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        return null;
      }
      throw error;
    }

    // Convert database row to UserProfile
    return createUserProfileFromDatabaseRow(data);
  } catch (error) {
    console.error(`Error fetching profile for user ${userId}:`, error);
    return null;
  }
}

// Update user profile with display name support
export async function updateUserProfile(
  userId: string,
  updates: ProfileUpdateData
): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select('id, username, email, avatar_url, avatar_thumbnail_url, avatar_medium_url, avatar_full_url, displayname, favorite_author, favorite_genre, bio, membership_tier')
      .single() as any;

    if (error) throw error;

    // Update cache
    if (data) {
      const updatedProfile = createUserProfileFromDatabaseRow(data);
      profileCache[userId] = updatedProfile;
      return updatedProfile;
    }

    return null;
  } catch (error) {
    console.error('Error updating user profile:', error);
    return null;
  }
}

// Create user profile with username and display name
export async function createUserProfile(
  profileData: ProfileCreateData
): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .insert([{
        id: profileData.id,
        username: profileData.username.trim(),
        email: profileData.email,
        displayname: profileData.displayname?.trim() || null
      }])
      .select('id, username, email, avatar_url, avatar_thumbnail_url, avatar_medium_url, avatar_full_url, displayname, favorite_author, favorite_genre, bio, membership_tier')
      .single() as any;

    if (error) throw error;

    if (data) {
      const newProfile = createUserProfileFromDatabaseRow(data);
      profileCache[profileData.id] = newProfile;
      return newProfile;
    }

    return null;
  } catch (error) {
    console.error('Error creating user profile:', error);
    return null;
  }
}

// Backward compatibility function for old signature
export async function createUserProfileLegacy(
  userId: string,
  username: string,
  email: string,
  displayName?: string
): Promise<UserProfile | null> {
  return createUserProfile({
    id: userId,
    username,
    email,
    displayname: displayName || null
  });
}

/**
 * Get user profile by username (for dual-identity system)
 * @param username Username to look up
 * @returns User profile or null if not found
 */
export async function getUserProfileByUsername(username: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, email, avatar_url, avatar_thumbnail_url, avatar_medium_url, avatar_full_url, displayname, favorite_author, favorite_genre, bio, membership_tier')
      .eq('username', username)
      .single() as any;

    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        return null;
      }
      throw error;
    }

    const profile = createUserProfileFromDatabaseRow(data);

    // Cache the result
    profileCache[data.id] = profile;

    return profile;
  } catch (error) {
    console.error(`Error fetching profile for username ${username}:`, error);
    return null;
  }
}
