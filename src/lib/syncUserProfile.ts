import { supabase } from '@/lib/supabase';

/**
 * Syncs a user's auth metadata to the users table
 * This allows other users to see profile information like favorite authors and genres
 */
export async function syncUserProfileToDatabase(userId: string): Promise<boolean> {
  try {
    // Get the current user's auth data
    const { data: authData, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('Error getting auth user:', authError);
      return false;
    }
    
    // Make sure we're only syncing the current user's data
    if (authData.user.id !== userId) {
      console.error('Cannot sync profile for another user');
      return false;
    }
    
    // Extract metadata
    const metadata = authData.user.user_metadata || {};
    
    console.log('Syncing user profile data to database:', {
      userId,
      metadata: {
        bio: metadata.bio,
        favorite_authors: metadata.favorite_authors,
        favorite_genres: metadata.favorite_genres
      }
    });
    
    // Update the users table with the metadata
    const { error: updateError } = await supabase
      .from('users')
      .update({
        bio: metadata.bio || null,
        favorite_authors: metadata.favorite_authors || null,
        favorite_genres: metadata.favorite_genres || null
      })
      .eq('id', userId);
    
    if (updateError) {
      console.error('Error updating user in database:', updateError);
      return false;
    }
    
    console.log(`Successfully synced profile data for user ${userId}`);
    return true;
  } catch (error) {
    console.error('Error syncing user profile:', error);
    return false;
  }
}
