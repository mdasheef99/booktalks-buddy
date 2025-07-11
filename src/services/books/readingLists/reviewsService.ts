/**
 * Reviews Service Module
 * 
 * Handles review management and operations for reading lists
 */

import { supabase, apiCall } from '@/lib/supabase';
import { PersonalBook, trackBookInteraction } from '../personalBooksService';
import * as Sentry from "@sentry/react";
import {
  validateUserId,
  validatePersonalBookId,
  validateReviewText,
  validatePrivacySetting,
  throwIfInvalid
} from '@/lib/api/books/validation';
import { ReadingListItem } from './types/readingLists';

// =====================================================
// Review Functions
// =====================================================

/**
 * Add or update a book review
 */
export async function updateBookReview(
  userId: string,
  bookId: string,
  reviewText?: string,
  reviewIsPublic: boolean = true
): Promise<ReadingListItem | null> {
  try {
    // Input validation
    throwIfInvalid(validateUserId(userId), 'userId');
    throwIfInvalid(validatePersonalBookId(bookId), 'bookId');
    throwIfInvalid(validateReviewText(reviewText), 'reviewText');
    throwIfInvalid(validatePrivacySetting(reviewIsPublic), 'reviewIsPublic');

    console.log(`Updating review for book ${bookId}, user ${userId}`);

    const updateData: any = {
      review_text: reviewText,
      review_is_public: reviewIsPublic,
      updated_at: new Date().toISOString()
    };

    const result = await apiCall<ReadingListItem>(
      supabase
        .from('reading_lists')
        .update(updateData)
        .eq('user_id', userId)
        .eq('book_id', bookId)
        .select(`
          *,
          personal_books (*)
        `)
        .single(),
      'Failed to update review'
    );

    if (result) {
      console.log(`Successfully updated review`);
      
      // Track interaction for recommendations
      const book = result.personal_books;
      if (book && reviewText) {
        await trackBookInteraction(userId, book.google_books_id, 'reviewed');
      }
    }

    return result;
    
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        source: "reviewsService",
        action: "updateBookReview"
      },
      extra: { userId, bookId, reviewText, reviewIsPublic }
    });
    
    console.error("Error updating review:", error);
    throw error;
  }
}

/**
 * Get user's reviews (public only for profile display)
 */
export async function getUserReviews(
  userId: string,
  includePrivate: boolean = false,
  limit: number = 10
): Promise<ReadingListItem[]> {
  try {
    // Input validation
    throwIfInvalid(validateUserId(userId), 'userId');

    console.log(`Fetching reviews for user ${userId}, includePrivate: ${includePrivate}`);

    let query = supabase
      .from('reading_lists')
      .select(`
        *,
        personal_books (*)
      `)
      .eq('user_id', userId)
      .not('review_text', 'is', null)
      .not('rating', 'is', null);

    // Apply privacy filter
    if (!includePrivate) {
      query = query.eq('review_is_public', true);
    }

    // Sort by most recent reviews
    query = query.order('rated_at', { ascending: false });

    if (limit > 0) {
      query = query.limit(limit);
    }

    const result = await apiCall<ReadingListItem[]>(
      query,
      'Failed to load reviews'
    );

    console.log(`Loaded ${result?.length || 0} reviews`);
    return result || [];
    
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        source: "reviewsService",
        action: "getUserReviews"
      },
      extra: { userId, includePrivate, limit }
    });
    
    console.error("Error fetching user reviews:", error);
    return [];
  }
}

/**
 * Get public reviews for profile viewing
 */
export async function getPublicReviews(
  userId: string,
  limit: number = 10
): Promise<ReadingListItem[]> {
  return getUserReviews(userId, false, limit);
}

/**
 * Search user's reviews by text content
 */
export async function searchUserReviews(
  userId: string,
  searchTerm: string,
  includePrivate: boolean = false,
  limit: number = 10
): Promise<ReadingListItem[]> {
  try {
    // Input validation
    throwIfInvalid(validateUserId(userId), 'userId');

    if (!searchTerm || searchTerm.trim().length === 0) {
      return getUserReviews(userId, includePrivate, limit);
    }

    console.log(`Searching reviews for user ${userId} with term: ${searchTerm}`);

    const searchLower = searchTerm.toLowerCase().trim();

    let query = supabase
      .from('reading_lists')
      .select(`
        *,
        personal_books (*)
      `)
      .eq('user_id', userId)
      .not('review_text', 'is', null)
      .ilike('review_text', `%${searchLower}%`);

    // Apply privacy filter
    if (!includePrivate) {
      query = query.eq('review_is_public', true);
    }

    // Sort by most recent reviews
    query = query.order('rated_at', { ascending: false });

    if (limit > 0) {
      query = query.limit(limit);
    }

    const result = await apiCall<ReadingListItem[]>(
      query,
      'Failed to search reviews'
    );

    console.log(`Found ${result?.length || 0} reviews matching search`);
    return result || [];
    
  } catch (error) {
    console.error("Error searching reviews:", error);
    return [];
  }
}

/**
 * Get review statistics for user
 */
export async function getReviewStats(userId: string): Promise<{
  totalReviews: number;
  publicReviews: number;
  privateReviews: number;
  averageReviewLength: number;
  mostRecentReview?: ReadingListItem;
}> {
  try {
    // Input validation
    throwIfInvalid(validateUserId(userId), 'userId');

    const { data, error } = await supabase
      .from('reading_lists')
      .select(`
        review_text,
        review_is_public,
        rated_at,
        personal_books (title, author)
      `)
      .eq('user_id', userId)
      .not('review_text', 'is', null)
      .order('rated_at', { ascending: false });

    if (error) {
      console.error("Error getting review stats:", error);
      return {
        totalReviews: 0,
        publicReviews: 0,
        privateReviews: 0,
        averageReviewLength: 0
      };
    }

    const reviews = data || [];
    const totalReviews = reviews.length;

    if (totalReviews === 0) {
      return {
        totalReviews: 0,
        publicReviews: 0,
        privateReviews: 0,
        averageReviewLength: 0
      };
    }

    const publicReviews = reviews.filter(r => r.review_is_public).length;
    const privateReviews = totalReviews - publicReviews;

    // Calculate average review length
    const totalLength = reviews.reduce((sum, review) => 
      sum + (review.review_text?.length || 0), 0
    );
    const averageReviewLength = Math.round(totalLength / totalReviews);

    // Get most recent review
    const mostRecentReview = reviews[0] as any;

    return {
      totalReviews,
      publicReviews,
      privateReviews,
      averageReviewLength,
      mostRecentReview
    };
    
  } catch (error) {
    console.error("Error getting review stats:", error);
    return {
      totalReviews: 0,
      publicReviews: 0,
      privateReviews: 0,
      averageReviewLength: 0
    };
  }
}
