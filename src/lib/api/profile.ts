import { supabase } from '../supabase';

export interface BookClubProfile {
  id: string;
  email: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  favorite_genres: string[] | null;
  favorite_authors: string[] | null;
  created_at: string;
}

export interface ClubMembership {
  club_id: string;
  club_name: string;
  role: string;
  joined_at: string;
  current_book?: {
    id: string;
    title: string;
    author: string;
    cover_url: string | null;
  } | null;
}

/**
 * Get a user's BookClub profile
 * @param userId User ID
 * @returns User profile data
 */
export async function getBookClubProfile(userId: string): Promise<BookClubProfile> {
  if (!userId) {
    throw new Error('User ID is required');
  }

  console.log('API: Fetching profile for user ID:', userId);

  const { data, error } = await supabase
    .from('users')
    .select('id, email, username, avatar_url, bio, favorite_genres, favorite_authors, created_at')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('API: Error fetching profile:', error);
    throw error;
  }

  if (!data) {
    console.error('API: No profile data found for user:', userId);
    throw new Error('Profile not found');
  }

  return data as BookClubProfile;
}

/**
 * Update a user's BookClub profile
 * @param userId User ID
 * @param updates Profile updates
 * @returns Updated profile data
 */
export async function updateBookClubProfile(
  userId: string,
  updates: {
    bio?: string;
    favorite_genres?: string[];
    favorite_authors?: string[];
    username?: string;
  }
): Promise<BookClubProfile> {
  if (!userId) {
    throw new Error('User ID is required');
  }

  console.log('API: Updating profile for user ID:', userId, 'with updates:', updates);

  try {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('API: Error updating profile:', error);
      throw error;
    }

    if (!data) {
      console.error('API: No profile data returned after update for user:', userId);
      throw new Error('Profile update failed');
    }

    console.log('API: Profile updated successfully:', data);
    return data as BookClubProfile;
  } catch (error) {
    console.error('API: Unexpected error in updateBookClubProfile:', error);
    throw error;
  }
}

/**
 * Get a user's BookClub memberships
 * @param userId User ID
 * @returns List of club memberships
 */
export async function getUserClubMemberships(userId: string): Promise<ClubMembership[]> {
  if (!userId) {
    throw new Error('User ID is required');
  }

  console.log('API: Fetching club memberships for user ID:', userId);

  try {
    // First check if the club_members table exists
    const { data: tableInfo, error: tableError } = await supabase
      .from('club_members')
      .select('count(*)', { count: 'exact', head: true });

    if (tableError) {
      console.error('API: Error checking club_members table:', tableError);
      console.log('API: Returning empty memberships due to table error');
      return [];
    }

    // Get club memberships
    const { data: memberships, error: membershipError } = await supabase
      .from('club_members')
      .select('club_id, role, joined_at')
      .eq('user_id', userId)
      .not('role', 'eq', 'pending');

    if (membershipError) {
      console.error('API: Error fetching memberships:', membershipError);
      return [];
    }

    if (!memberships || memberships.length === 0) {
      console.log('API: No club memberships found for user:', userId);
      return [];
    }

    console.log('API: Found memberships:', memberships);

    // Get club details
    const clubIds = memberships.map(m => m.club_id);
    const { data: clubs, error: clubError } = await supabase
      .from('book_clubs')
      .select('id, name')
      .in('id', clubIds);

    if (clubError) {
      console.error('API: Error fetching clubs:', clubError);
      // Continue with what we have
      const result = memberships.map(membership => ({
        club_id: membership.club_id,
        club_name: 'Unknown Club',
        role: membership.role,
        joined_at: membership.joined_at,
        current_book: null
      }));
      return result;
    }

    // Try to get current books, but don't fail if this doesn't work
    let currentBooks = [];
    try {
      const { data: booksData, error: booksError } = await supabase
        .from('current_books')
        .select('club_id, book_id, book:books(id, title, author, cover_url)')
        .in('club_id', clubIds);

      if (!booksError && booksData) {
        currentBooks = booksData;
      }
    } catch (booksError) {
      console.error('API: Error fetching current books:', booksError);
      // Continue without book data
    }

    // Combine the data
    const result = memberships.map(membership => {
      const club = clubs?.find(c => c.id === membership.club_id);
      const currentBookEntry = currentBooks?.find(cb => cb.club_id === membership.club_id);

      return {
        club_id: membership.club_id,
        club_name: club?.name || 'Unknown Club',
        role: membership.role,
        joined_at: membership.joined_at,
        current_book: currentBookEntry?.book || null
      };
    });

    console.log('API: Processed memberships result:', result);
    return result;
  } catch (error) {
    console.error('API: Unexpected error in getUserClubMemberships:', error);
    // Return empty array instead of throwing
    return [];
  }
}

/**
 * Upload a profile avatar
 * @param userId User ID
 * @param file File to upload
 * @returns URL of the uploaded avatar
 */
export async function uploadProfileAvatar(userId: string, file: File): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}-${Date.now()}.${fileExt}`;
  const filePath = `avatars/${fileName}`;

  // Upload the file
  const { error: uploadError } = await supabase.storage
    .from('profiles')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  // Get the public URL
  const { data } = supabase.storage
    .from('profiles')
    .getPublicUrl(filePath);

  // Update the user profile
  const { error: updateError } = await supabase
    .from('users')
    .update({ avatar_url: data.publicUrl })
    .eq('id', userId);

  if (updateError) throw updateError;

  return data.publicUrl;
}
