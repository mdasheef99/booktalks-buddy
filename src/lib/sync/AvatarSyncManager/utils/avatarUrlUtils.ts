/**
 * Avatar URL Utilities
 * Utilities for fetching and managing avatar URLs
 */

import { supabase } from '@/lib/supabase';
import { safeSupabaseQuery } from '@/lib/database/SafeQuery';
import type { AvatarUrls } from '../types/avatarTypes';

/**
 * Avatar URL management utilities
 */
export class AvatarUrlUtils {
  /**
   * Get current user's avatar URLs for rollback purposes
   */
  static async getCurrentAvatarUrls(userId: string): Promise<Partial<AvatarUrls>> {
    try {
      const userQuery = supabase
        .from('users')
        .select('avatar_url, avatar_thumbnail_url, avatar_medium_url, avatar_full_url')
        .eq('id', userId)
        .single();

      const { data, error } = await safeSupabaseQuery(
        userQuery,
        null,
        'get_current_avatar_urls'
      );

      if (error) {
        console.warn('Could not fetch current avatar URLs for rollback:', error);
        return {};
      }

      if (!data) {
        return {};
      }

      return {
        legacy: data.avatar_url,
        thumbnail: data.avatar_thumbnail_url,
        medium: data.avatar_medium_url,
        full: data.avatar_full_url
      };
    } catch (error) {
      console.warn('Error fetching current avatar URLs:', error);
      return {};
    }
  }

  /**
   * Update user's avatar URLs in database
   */
  static async updateAvatarUrls(userId: string, avatarUrls: Partial<AvatarUrls>): Promise<void> {
    const updateQuery = supabase
      .from('users')
      .update({
        avatar_url: avatarUrls.legacy,
        avatar_thumbnail_url: avatarUrls.thumbnail,
        avatar_medium_url: avatarUrls.medium,
        avatar_full_url: avatarUrls.full
      })
      .eq('id', userId);

    const { error } = await safeSupabaseQuery(
      updateQuery,
      null,
      'update_avatar_urls'
    );

    if (error) {
      throw new Error(`Failed to update avatar URLs: ${error}`);
    }
  }

  /**
   * Check if avatar URLs are valid (not null/empty)
   */
  static validateAvatarUrls(avatarUrls: Partial<AvatarUrls>): boolean {
    const requiredFields: (keyof AvatarUrls)[] = ['thumbnail', 'medium', 'full', 'legacy'];
    
    return requiredFields.every(field => {
      const url = avatarUrls[field];
      return url && url.trim().length > 0;
    });
  }

  /**
   * Get avatar URL by size preference
   */
  static getPreferredAvatarUrl(
    avatarUrls: Partial<AvatarUrls>, 
    preferredSize: 'thumbnail' | 'medium' | 'full' = 'medium'
  ): string | null {
    // Try preferred size first
    if (avatarUrls[preferredSize]) {
      return avatarUrls[preferredSize]!;
    }

    // Fallback order based on preferred size
    const fallbackOrder = {
      thumbnail: ['thumbnail', 'medium', 'full', 'legacy'],
      medium: ['medium', 'full', 'thumbnail', 'legacy'],
      full: ['full', 'medium', 'thumbnail', 'legacy']
    };

    for (const size of fallbackOrder[preferredSize]) {
      const url = avatarUrls[size as keyof AvatarUrls];
      if (url && url.trim().length > 0) {
        return url;
      }
    }

    return null;
  }

  /**
   * Extract file paths from avatar URLs for cleanup
   */
  static extractFilePathsFromUrls(avatarUrls: Partial<AvatarUrls>): string[] {
    const paths: string[] = [];
    
    Object.values(avatarUrls).forEach(url => {
      if (url && typeof url === 'string') {
        // Extract file path from Supabase storage URL
        const match = url.match(/\/storage\/v1\/object\/public\/profiles\/(.+)$/);
        if (match && match[1]) {
          paths.push(match[1]);
        }
      }
    });

    return paths;
  }

  /**
   * Compare two avatar URL sets for differences
   */
  static compareAvatarUrls(
    urls1: Partial<AvatarUrls>, 
    urls2: Partial<AvatarUrls>
  ): {
    identical: boolean;
    differences: Array<{
      field: keyof AvatarUrls;
      value1: string | undefined;
      value2: string | undefined;
    }>;
  } {
    const differences: Array<{
      field: keyof AvatarUrls;
      value1: string | undefined;
      value2: string | undefined;
    }> = [];

    const fields: (keyof AvatarUrls)[] = ['thumbnail', 'medium', 'full', 'legacy'];

    fields.forEach(field => {
      const val1 = urls1[field];
      const val2 = urls2[field];
      
      if (val1 !== val2) {
        differences.push({
          field,
          value1: val1,
          value2: val2
        });
      }
    });

    return {
      identical: differences.length === 0,
      differences
    };
  }
}
