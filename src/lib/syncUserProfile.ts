import { supabase } from '@/lib/supabase';
import { ProfileSyncError, SyncErrorType, attemptErrorRecovery } from './sync/ProfileSyncError';
import { validateAndReportSync } from './sync/ProfileSyncValidator';
import { ProfileCacheManager, CacheInvalidationReason } from './sync/ProfileCacheManager';

/**
 * Enhanced sync function with validation and error recovery
 * Syncs a user's auth metadata to the users table with comprehensive error handling
 */
export async function syncUserProfileToDatabase(userId: string): Promise<boolean> {
  try {
    // Get the current user's auth data
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError) {
      const syncError = ProfileSyncError.fromAuthError(authError, {
        userId,
        operation: 'sync_profile'
      });
      syncError.logError();

      // Attempt error recovery
      const recovered = await attemptErrorRecovery(syncError);
      if (!recovered) {
        console.error('Error getting auth user:', authError);
        return false;
      }
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
      const syncError = ProfileSyncError.fromSupabaseError(updateError, {
        userId,
        operation: 'sync_profile'
      });
      syncError.logError();

      // Attempt error recovery
      const recovered = await attemptErrorRecovery(syncError);
      if (!recovered) {
        console.error('Error updating user in database:', updateError);
        return false;
      }
    }

    // Invalidate cache after successful sync
    try {
      await ProfileCacheManager.invalidateUserProfile(userId, CacheInvalidationReason.SYNC_RECOVERY);
    } catch (cacheError) {
      console.warn('Cache invalidation failed after sync, but sync was successful:', cacheError);
      // Don't fail the sync operation due to cache issues
    }

    // Validate sync after completion (non-blocking)
    validateAndReportSync(userId).catch(error => {
      console.warn('Post-sync validation failed:', error);
    });

    console.log(`Successfully synced profile data for user ${userId}`);
    return true;
  } catch (error) {
    const syncError = new ProfileSyncError(
      SyncErrorType.PARTIAL_SYNC_FAILURE,
      'Unexpected error during profile sync',
      { userId, operation: 'sync_profile', originalError: error as Error },
      true
    );
    syncError.logError();

    // Attempt error recovery
    const recovered = await attemptErrorRecovery(syncError);
    if (!recovered) {
      console.error('Error syncing user profile:', error);
      return false;
    }

    return true;
  }
}
