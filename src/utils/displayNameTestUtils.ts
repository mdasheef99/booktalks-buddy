// Display Name Testing Utilities
// Utilities to test and verify display name functionality

import { supabase } from '@/lib/supabase';
import { updateUserProfile } from '@/services/profileService';

export interface DisplayNameTestResult {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * Check if any users in the database have display names
 */
export async function checkUsersWithDisplayNames(): Promise<DisplayNameTestResult> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, displayname, account_tier')
      .not('displayname', 'is', null)
      .limit(10);

    if (error) {
      return {
        success: false,
        message: `Database error: ${error.message}`
      };
    }

    return {
      success: true,
      message: `Found ${data?.length || 0} users with display names`,
      data: data
    };
  } catch (error) {
    return {
      success: false,
      message: `Error: ${error}`
    };
  }
}

/**
 * Add test display names to existing users (for testing purposes)
 */
export async function addTestDisplayNames(): Promise<DisplayNameTestResult> {
  try {
    // Get some users without display names
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('id, username')
      .is('displayname', null)
      .limit(3);

    if (fetchError) {
      return {
        success: false,
        message: `Error fetching users: ${fetchError.message}`
      };
    }

    if (!users || users.length === 0) {
      return {
        success: true,
        message: 'No users found without display names'
      };
    }

    // Add test display names
    const testDisplayNames = [
      'Book Lover',
      'Reading Enthusiast', 
      'Literary Explorer'
    ];

    const updates = [];
    for (let i = 0; i < Math.min(users.length, testDisplayNames.length); i++) {
      const user = users[i];
      const displayName = testDisplayNames[i];
      
      try {
        const result = await updateUserProfile(user.id, {
          displayname: displayName
        });
        
        if (result) {
          updates.push({
            userId: user.id,
            username: user.username,
            displayName: displayName,
            success: true
          });
        } else {
          updates.push({
            userId: user.id,
            username: user.username,
            displayName: displayName,
            success: false,
            error: 'Update returned null'
          });
        }
      } catch (updateError) {
        updates.push({
          userId: user.id,
          username: user.username,
          displayName: displayName,
          success: false,
          error: updateError
        });
      }
    }

    const successCount = updates.filter(u => u.success).length;
    
    return {
      success: successCount > 0,
      message: `Updated ${successCount}/${updates.length} users with test display names`,
      data: updates
    };
  } catch (error) {
    return {
      success: false,
      message: `Error: ${error}`
    };
  }
}

/**
 * Verify display name functionality by checking a specific user
 */
export async function verifyUserDisplayName(userId: string): Promise<DisplayNameTestResult> {
  try {
    // Check database directly
    const { data: dbData, error: dbError } = await supabase
      .from('users')
      .select('id, username, displayname, account_tier')
      .eq('id', userId)
      .single();

    if (dbError) {
      return {
        success: false,
        message: `Database error: ${dbError.message}`
      };
    }

    // Check through profile service
    const { getUserProfile } = await import('@/services/profileService');
    const profileData = await getUserProfile(userId);

    return {
      success: true,
      message: 'User data retrieved successfully',
      data: {
        database: dbData,
        profileService: profileData,
        displayNameMatch: dbData?.displayname === profileData?.displayname
      }
    };
  } catch (error) {
    return {
      success: false,
      message: `Error: ${error}`
    };
  }
}

/**
 * Get all users for debugging
 */
export async function getAllUsersForDebugging(): Promise<DisplayNameTestResult> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, displayname, account_tier, created_at')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      return {
        success: false,
        message: `Database error: ${error.message}`
      };
    }

    return {
      success: true,
      message: `Retrieved ${data?.length || 0} users`,
      data: data
    };
  } catch (error) {
    return {
      success: false,
      message: `Error: ${error}`
    };
  }
}
