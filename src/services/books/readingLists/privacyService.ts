/**
 * Privacy Service Module
 * 
 * Handles privacy settings and bulk operations for reading lists
 */

import { supabase, apiCall } from '@/lib/supabase';
import * as Sentry from "@sentry/react";
import {
  validateUserId,
  validatePersonalBookId,
  validatePrivacySetting,
  throwIfInvalid
} from '@/lib/api/books/validation';

// =====================================================
// Privacy Management Functions
// =====================================================

/**
 * Update privacy settings for reading list item
 */
export async function updateItemPrivacy(
  userId: string,
  bookId: string,
  isPublic: boolean,
  reviewIsPublic?: boolean
): Promise<boolean> {
  try {
    // Input validation
    throwIfInvalid(validateUserId(userId), 'userId');
    throwIfInvalid(validatePersonalBookId(bookId), 'bookId');
    throwIfInvalid(validatePrivacySetting(isPublic), 'isPublic');
    
    if (reviewIsPublic !== undefined) {
      throwIfInvalid(validatePrivacySetting(reviewIsPublic), 'reviewIsPublic');
    }

    console.log(`Updating privacy for user ${userId}, book ${bookId}: public=${isPublic}`);

    const updates: any = { is_public: isPublic };
    
    if (reviewIsPublic !== undefined) {
      updates.review_is_public = reviewIsPublic;
    }

    const result = await apiCall<any>(
      supabase
        .from('reading_lists')
        .update(updates)
        .eq('user_id', userId)
        .eq('book_id', bookId),
      'Failed to update item privacy'
    );

    if (result !== null) {
      console.log(`Successfully updated item privacy`);
    }

    return result !== null;
    
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        source: "privacyService",
        action: "updateItemPrivacy"
      },
      extra: { userId, bookId, isPublic, reviewIsPublic }
    });
    
    console.error("Error updating item privacy:", error);
    return false;
  }
}

/**
 * Bulk update privacy for all reading list items
 */
export async function bulkUpdatePrivacy(
  userId: string,
  isPublic: boolean,
  reviewIsPublic?: boolean
): Promise<boolean> {
  try {
    // Input validation
    throwIfInvalid(validateUserId(userId), 'userId');
    throwIfInvalid(validatePrivacySetting(isPublic), 'isPublic');
    
    if (reviewIsPublic !== undefined) {
      throwIfInvalid(validatePrivacySetting(reviewIsPublic), 'reviewIsPublic');
    }

    console.log(`Bulk updating privacy for user ${userId}: public=${isPublic}`);

    const updates: any = { is_public: isPublic };
    
    if (reviewIsPublic !== undefined) {
      updates.review_is_public = reviewIsPublic;
    }

    const result = await apiCall<any>(
      supabase
        .from('reading_lists')
        .update(updates)
        .eq('user_id', userId),
      'Failed to update privacy settings'
    );

    if (result !== null) {
      console.log(`Successfully updated privacy for all items`);
    }

    return result !== null;
    
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        source: "privacyService",
        action: "bulkUpdatePrivacy"
      },
      extra: { userId, isPublic, reviewIsPublic }
    });
    
    console.error("Error bulk updating privacy:", error);
    return false;
  }
}

/**
 * Get privacy statistics for user
 */
export async function getPrivacyStats(userId: string): Promise<{
  totalItems: number;
  publicItems: number;
  privateItems: number;
  publicReviews: number;
  privateReviews: number;
}> {
  try {
    // Input validation
    throwIfInvalid(validateUserId(userId), 'userId');

    const { data, error } = await supabase
      .from('reading_lists')
      .select('is_public, review_is_public, review_text')
      .eq('user_id', userId);

    if (error) {
      console.error("Error getting privacy stats:", error);
      return {
        totalItems: 0,
        publicItems: 0,
        privateItems: 0,
        publicReviews: 0,
        privateReviews: 0
      };
    }

    const items = data || [];
    const totalItems = items.length;
    const publicItems = items.filter(item => item.is_public).length;
    const privateItems = totalItems - publicItems;
    
    const reviewItems = items.filter(item => item.review_text);
    const publicReviews = reviewItems.filter(item => item.review_is_public).length;
    const privateReviews = reviewItems.length - publicReviews;

    return {
      totalItems,
      publicItems,
      privateItems,
      publicReviews,
      privateReviews
    };
    
  } catch (error) {
    console.error("Error getting privacy stats:", error);
    return {
      totalItems: 0,
      publicItems: 0,
      privateItems: 0,
      publicReviews: 0,
      privateReviews: 0
    };
  }
}
