import { supabase } from '@/lib/supabase';

/**
 * Syncs all users' auth metadata to the users table
 * This script should be run once to populate the users table with profile data
 */
async function syncAllProfiles() {
  try {
    console.log('Starting sync of all user profiles...');

    // Get all users from auth
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error('Error getting auth users:', authError);
      return;
    }

    console.log(`Found ${authUsers.users.length} users to sync`);

    // Process each user
    let successCount = 0;
    let errorCount = 0;

    for (const authUser of authUsers.users) {
      try {
        const metadata = authUser.user_metadata || {};

        console.log(`Processing user ${authUser.id}:`, {
          metadata: {
            bio: metadata.bio,
            favorite_authors: metadata.favorite_authors,
            favorite_genres: metadata.favorite_genres
          }
        });

        // Update the users table
        const { error: updateError } = await supabase
          .from('users')
          .update({
            bio: metadata.bio || null,
            favorite_authors: metadata.favorite_authors || null,
            favorite_genres: metadata.favorite_genres || null
          })
          .eq('id', authUser.id);

        if (updateError) {
          console.error(`Error updating user ${authUser.id}:`, updateError);
          errorCount++;
          continue;
        }

        console.log(`Successfully synced profile data for user ${authUser.id}`);
        successCount++;
      } catch (error) {
        console.error(`Error processing user ${authUser.id}:`, error);
        errorCount++;
      }
    }

    console.log(`Finished syncing all user profiles. Success: ${successCount}, Errors: ${errorCount}`);
  } catch (error) {
    console.error('Error in sync process:', error);
  }
}

// To run this script:
// 1. Save it as a .ts file
// 2. Run it with ts-node: npx ts-node -r tsconfig-paths/register src/scripts/syncAllProfiles.ts

// Run the script
syncAllProfiles();

export default syncAllProfiles;
