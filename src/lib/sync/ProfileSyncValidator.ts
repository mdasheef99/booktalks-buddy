/**
 * Profile Synchronization Validation Framework
 * Detects and recovers from data inconsistencies between Auth metadata and Users table
 */

import { supabase } from '@/lib/supabase';
import { ProfileSyncError, SyncErrorType } from './ProfileSyncError';

export interface SyncInconsistency {
  field: string;
  authValue: any;
  dbValue: any;
  severity: 'low' | 'medium' | 'high';
  description: string;
}

export interface SyncValidationResult {
  valid: boolean;
  inconsistencies: SyncInconsistency[];
  recovered: boolean;
  validationTime: number;
}

export interface AuthMetadata {
  bio?: string;
  favorite_authors?: string[];
  favorite_genres?: string[];
  reading_frequency?: string;
  preferred_meeting_times?: string[];
}

export interface DatabaseProfile {
  bio?: string;
  favorite_author?: string;
  favorite_genre?: string;
  displayname?: string;
  avatar_url?: string;
  avatar_thumbnail_url?: string;
  avatar_medium_url?: string;
  avatar_full_url?: string;
}

/**
 * Get Auth metadata for user
 */
async function getAuthMetadata(userId: string): Promise<AuthMetadata | null> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user || user.id !== userId) {
      return null;
    }

    return user.user_metadata || {};
  } catch (error) {
    console.error('Error fetching auth metadata:', error);
    return null;
  }
}

/**
 * Get database profile for user
 */
async function getDatabaseProfile(userId: string): Promise<DatabaseProfile | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('bio, favorite_author, favorite_genre, displayname, avatar_url, avatar_thumbnail_url, avatar_medium_url, avatar_full_url')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching database profile:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching database profile:', error);
    return null;
  }
}

/**
 * Detect inconsistencies between Auth metadata and database profile
 */
function detectInconsistencies(
  authData: AuthMetadata | null,
  dbData: DatabaseProfile | null
): SyncInconsistency[] {
  const inconsistencies: SyncInconsistency[] = [];

  if (!authData || !dbData) {
    if (!authData && !dbData) {
      return []; // Both missing is consistent
    }
    
    inconsistencies.push({
      field: 'profile_existence',
      authValue: !!authData,
      dbValue: !!dbData,
      severity: 'high',
      description: 'Profile data missing from one storage location'
    });
    return inconsistencies;
  }

  // Check bio consistency
  if (authData.bio !== dbData.bio) {
    inconsistencies.push({
      field: 'bio',
      authValue: authData.bio,
      dbValue: dbData.bio,
      severity: 'medium',
      description: 'Bio text differs between Auth metadata and database'
    });
  }

  // Check favorite author consistency (Auth has array, DB has single value)
  const authFirstAuthor = authData.favorite_authors?.[0];
  if (authFirstAuthor !== dbData.favorite_author) {
    inconsistencies.push({
      field: 'favorite_author',
      authValue: authFirstAuthor,
      dbValue: dbData.favorite_author,
      severity: 'low',
      description: 'Primary favorite author differs between storages'
    });
  }

  // Check favorite genre consistency (Auth has array, DB has single value)
  const authFirstGenre = authData.favorite_genres?.[0];
  if (authFirstGenre !== dbData.favorite_genre) {
    inconsistencies.push({
      field: 'favorite_genre',
      authValue: authFirstGenre,
      dbValue: dbData.favorite_genre,
      severity: 'low',
      description: 'Primary favorite genre differs between storages'
    });
  }

  // Check avatar URL consistency
  if (dbData.avatar_url && !dbData.avatar_thumbnail_url && !dbData.avatar_medium_url && !dbData.avatar_full_url) {
    inconsistencies.push({
      field: 'avatar_urls',
      authValue: 'legacy_only',
      dbValue: 'missing_multi_tier',
      severity: 'medium',
      description: 'Avatar has legacy URL but missing multi-tier URLs'
    });
  }

  // Check for broken avatar URLs (basic validation)
  const avatarUrls = [dbData.avatar_url, dbData.avatar_thumbnail_url, dbData.avatar_medium_url, dbData.avatar_full_url];
  const brokenUrls = avatarUrls.filter(url => url && !url.startsWith('http'));
  if (brokenUrls.length > 0) {
    inconsistencies.push({
      field: 'avatar_url_format',
      authValue: 'valid_urls_expected',
      dbValue: brokenUrls,
      severity: 'high',
      description: 'Avatar URLs have invalid format'
    });
  }

  return inconsistencies;
}

/**
 * Attempt to recover from sync inconsistencies
 */
async function attemptSyncRecovery(
  userId: string,
  inconsistencies: SyncInconsistency[]
): Promise<boolean> {
  try {
    // Get fresh data
    const authData = await getAuthMetadata(userId);
    if (!authData) {
      console.warn('Cannot recover sync: Auth metadata not accessible');
      return false;
    }

    // Prepare database updates based on Auth metadata (Auth is source of truth)
    const updates: Partial<DatabaseProfile> = {};

    for (const inconsistency of inconsistencies) {
      switch (inconsistency.field) {
        case 'bio':
          updates.bio = authData.bio || null;
          break;
        case 'favorite_author':
          updates.favorite_author = authData.favorite_authors?.[0] || null;
          break;
        case 'favorite_genre':
          updates.favorite_genre = authData.favorite_genres?.[0] || null;
          break;
      }
    }

    if (Object.keys(updates).length === 0) {
      return true; // Nothing to update
    }

    // Apply updates to database
    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId);

    if (error) {
      console.error('Sync recovery failed:', error);
      return false;
    }

    console.log('Sync recovery successful:', updates);
    return true;
  } catch (error) {
    console.error('Error during sync recovery:', error);
    return false;
  }
}

/**
 * Validate profile synchronization between Auth metadata and Users table
 */
export async function validateProfileSync(userId: string): Promise<SyncValidationResult> {
  const startTime = Date.now();

  try {
    // Fetch data from both sources
    const [authData, dbData] = await Promise.all([
      getAuthMetadata(userId),
      getDatabaseProfile(userId)
    ]);

    // Detect inconsistencies
    const inconsistencies = detectInconsistencies(authData, dbData);

    let recovered = false;
    if (inconsistencies.length > 0) {
      // Attempt automatic recovery for non-critical inconsistencies
      const criticalInconsistencies = inconsistencies.filter(i => i.severity === 'high');
      
      if (criticalInconsistencies.length === 0) {
        recovered = await attemptSyncRecovery(userId, inconsistencies);
      }
    }

    const validationTime = Date.now() - startTime;

    return {
      valid: inconsistencies.length === 0 || recovered,
      inconsistencies,
      recovered,
      validationTime
    };
  } catch (error) {
    console.error('Sync validation failed:', error);
    
    return {
      valid: false,
      inconsistencies: [{
        field: 'validation_error',
        authValue: null,
        dbValue: null,
        severity: 'high',
        description: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }],
      recovered: false,
      validationTime: Date.now() - startTime
    };
  }
}

/**
 * Validate and report sync status (non-breaking monitoring)
 */
export async function validateAndReportSync(userId: string): Promise<void> {
  try {
    const validation = await validateProfileSync(userId);
    
    if (!validation.valid) {
      console.warn('Profile sync inconsistencies detected:', {
        userId,
        inconsistencies: validation.inconsistencies,
        recovered: validation.recovered,
        validationTime: validation.validationTime
      });

      // Log for monitoring without breaking user flow
      if (validation.inconsistencies.some(i => i.severity === 'high')) {
        console.error('Critical sync inconsistencies detected for user:', userId);
      }
    } else {
      console.log('Profile sync validation passed:', {
        userId,
        validationTime: validation.validationTime
      });
    }
  } catch (error) {
    console.error('Sync validation failed:', error);
    // Don't throw - this is monitoring only
  }
}

/**
 * Force sync recovery for a user (manual intervention)
 */
export async function forceSyncRecovery(userId: string): Promise<boolean> {
  try {
    const validation = await validateProfileSync(userId);
    
    if (validation.inconsistencies.length > 0) {
      return await attemptSyncRecovery(userId, validation.inconsistencies);
    }
    
    return true; // Already in sync
  } catch (error) {
    console.error('Force sync recovery failed:', error);
    return false;
  }
}
