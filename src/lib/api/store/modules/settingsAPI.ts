/**
 * Settings API Module
 * Handles showcase settings operations
 */

import { supabase } from '@/lib/supabase';
import type { ShowcaseSettingsUpdate } from '../types/communityShowcaseTypes';
import { 
  TABLE_NAMES, 
  QUERY_SELECTORS, 
  ERROR_MESSAGES,
  DEFAULT_SHOWCASE_SETTINGS 
} from '../constants/communityShowcaseConstants';
import { 
  getCurrentISOString,
  isNotFoundError,
  validateStoreId,
  logErrorWithContext
} from '../utils/communityShowcaseUtils';

/**
 * Settings API operations
 */
export class SettingsAPI {
  /**
   * Get showcase settings
   */
  static async getShowcaseSettings(storeId: string) {
    if (!validateStoreId(storeId)) {
      throw new Error('Invalid store ID');
    }

    const { data, error } = await supabase
      .from(TABLE_NAMES.STORE_COMMUNITY_SHOWCASE)
      .select(QUERY_SELECTORS.SHOWCASE_SETTINGS)
      .eq('store_id', storeId)
      .limit(1)
      .single();

    if (error && !isNotFoundError(error)) {
      logErrorWithContext('getShowcaseSettings', error);
    }

    return data || DEFAULT_SHOWCASE_SETTINGS;
  }

  /**
   * Update showcase settings
   */
  static async updateShowcaseSettings(storeId: string, settings: Partial<ShowcaseSettingsUpdate>): Promise<void> {
    if (!validateStoreId(storeId)) {
      throw new Error('Invalid store ID');
    }

    // First try to update existing settings
    const { error: updateError } = await supabase
      .from(TABLE_NAMES.STORE_COMMUNITY_SHOWCASE)
      .update({
        ...settings,
        updated_at: getCurrentISOString(),
      })
      .eq('store_id', storeId)
      .is('featured_member_id', null); // Update settings-only rows

    if (updateError && isNotFoundError(updateError)) {
      // No settings row exists, create one
      const { error: insertError } = await supabase
        .from(TABLE_NAMES.STORE_COMMUNITY_SHOWCASE)
        .insert({
          store_id: storeId,
          ...settings,
        });

      if (insertError) {
        logErrorWithContext('createShowcaseSettings', insertError);
        throw new Error(ERROR_MESSAGES.CREATE_SETTINGS);
      }
    } else if (updateError) {
      logErrorWithContext('updateShowcaseSettings', updateError);
      throw new Error(ERROR_MESSAGES.UPDATE_SETTINGS);
    }
  }
}
