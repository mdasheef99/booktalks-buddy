// Copy and paste this code into your browser console while logged in as an admin

// Function to sync a single user's profile
async function syncUserProfile(userId) {
  try {
    // Get the user's auth data
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
    
    if (authError) {
      console.error(`Error getting auth data for user ${userId}:`, authError);
      return false;
    }
    
    // Extract metadata
    const metadata = authUser.user.user_metadata || {};
    
    console.log(`Syncing profile for user ${userId}:`, {
      bio: metadata.bio,
      favorite_authors: metadata.favorite_authors,
      favorite_genres: metadata.favorite_genres
    });
    
    // Update the users table
    const { error: updateError } = await supabase
      .from('users')
      .update({
        bio: metadata.bio || null,
        favorite_authors: metadata.favorite_authors || null,
        favorite_genres: metadata.favorite_genres || null
      })
      .eq('id', userId);
    
    if (updateError) {
      console.error(`Error updating user ${userId}:`, updateError);
      return false;
    }
    
    console.log(`Successfully synced profile for user ${userId}`);
    return true;
  } catch (error) {
    console.error(`Error syncing user ${userId}:`, error);
    return false;
  }
}

// Function to sync the current user's profile
async function syncCurrentUserProfile() {
  try {
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Error getting current user:', userError);
      return false;
    }
    
    if (!user) {
      console.error('No user is currently logged in');
      return false;
    }
    
    return await syncUserProfile(user.id);
  } catch (error) {
    console.error('Error syncing current user profile:', error);
    return false;
  }
}

// Run this function in the console to sync your own profile
// syncCurrentUserProfile();
