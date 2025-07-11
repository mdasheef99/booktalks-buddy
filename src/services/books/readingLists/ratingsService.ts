/**
 * Ratings Service Module
 * 
 * Handles book rating functionality for reading lists
 */

import { supabase, apiCall } from '@/lib/supabase';
import { PersonalBook, trackBookInteraction } from '../personalBooksService';
import * as Sentry from "@sentry/react";
import {
  validateUserId,
  validatePersonalBookId,
  validateRating,
  validateOptionalRating,
  validateReviewText,
  validatePrivacySetting,
  throwIfInvalid
} from '@/lib/api/books/validation';
import { ReadingListItem } from './types/readingLists';

// =====================================================
// Rating Functions
// =====================================================

/**
 * Rate a book (with optional review)
 */
export async function rateBook(
  userId: string,
  bookId: string,
  rating: number,
  reviewText?: string,
  reviewIsPublic: boolean = true
): Promise<ReadingListItem | null> {
  try {
    // Input validation
    throwIfInvalid(validateUserId(userId), 'userId');
    throwIfInvalid(validatePersonalBookId(bookId), 'bookId');
    throwIfInvalid(validateRating(rating), 'rating');
    throwIfInvalid(validateReviewText(reviewText), 'reviewText');
    throwIfInvalid(validatePrivacySetting(reviewIsPublic), 'reviewIsPublic');

    console.log(`Rating book ${bookId} for user ${userId}: ${rating} stars`);

    // Prepare update data
    const updateData: any = {
      rating,
      rated_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (reviewText !== undefined) {
      updateData.review_text = reviewText;
      updateData.review_is_public = reviewIsPublic;
    }

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
      'Failed to rate book'
    );

    if (result) {
      console.log(`Successfully rated book: ${rating} stars`);
      
      // Track interaction for recommendations
      const book = result.personal_books;
      if (book) {
        await trackBookInteraction(userId, book.google_books_id, 'rated', rating);
        
        if (reviewText) {
          await trackBookInteraction(userId, book.google_books_id, 'reviewed');
        }
      }
    }

    return result;
    
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        source: "ratingsService",
        action: "rateBook"
      },
      extra: { userId, bookId, rating, reviewText, reviewIsPublic }
    });
    
    console.error("Error rating book:", error);
    throw error;
  }
}

/**
 * Update book rating
 */
export async function updateBookRating(
  userId: string,
  bookId: string,
  rating?: number
): Promise<ReadingListItem | null> {
  try {
    // Input validation
    throwIfInvalid(validateUserId(userId), 'userId');
    throwIfInvalid(validatePersonalBookId(bookId), 'bookId');
    throwIfInvalid(validateOptionalRating(rating), 'rating');

    console.log(`Updating rating for book ${bookId}, user ${userId}: ${rating || 'removing rating'}`);

    const updateData: any = {
      rating,
      updated_at: new Date().toISOString()
    };

    if (rating !== undefined && rating !== null) {
      updateData.rated_at = new Date().toISOString();
    }

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
      'Failed to update rating'
    );

    if (result) {
      console.log(`Successfully updated rating`);
      
      // Track interaction for recommendations
      const book = result.personal_books;
      if (book && rating !== undefined && rating !== null) {
        await trackBookInteraction(userId, book.google_books_id, 'rated', rating);
      }
    }

    return result;
    
  } catch (error) {
    console.error("Error updating rating:", error);
    throw error;
  }
}

/**
 * Get user's ratings statistics
 */
export async function getUserRatingStats(userId: string): Promise<{
  totalRatings: number;
  averageRating: number;
  ratingDistribution: Record<number, number>;
  mostRecentRating?: ReadingListItem;
}> {
  try {
    // Input validation
    throwIfInvalid(validateUserId(userId), 'userId');

    const { data, error } = await supabase
      .from('reading_lists')
      .select(`
        rating,
        rated_at,
        personal_books (title, author)
      `)
      .eq('user_id', userId)
      .not('rating', 'is', null)
      .order('rated_at', { ascending: false });

    if (error) {
      console.error("Error getting rating stats:", error);
      return {
        totalRatings: 0,
        averageRating: 0,
        ratingDistribution: {}
      };
    }

    const ratings = data || [];
    const totalRatings = ratings.length;

    if (totalRatings === 0) {
      return {
        totalRatings: 0,
        averageRating: 0,
        ratingDistribution: {}
      };
    }

    // Calculate average rating
    const totalScore = ratings.reduce((sum, item) => sum + (item.rating || 0), 0);
    const averageRating = Math.round((totalScore / totalRatings) * 10) / 10;

    // Calculate rating distribution
    const ratingDistribution: Record<number, number> = {};
    for (let i = 1; i <= 5; i++) {
      ratingDistribution[i] = 0;
    }
    
    ratings.forEach(item => {
      if (item.rating) {
        ratingDistribution[item.rating] = (ratingDistribution[item.rating] || 0) + 1;
      }
    });

    // Get most recent rating
    const mostRecentRating = ratings[0] as any;

    return {
      totalRatings,
      averageRating,
      ratingDistribution,
      mostRecentRating
    };
    
  } catch (error) {
    console.error("Error getting rating stats:", error);
    return {
      totalRatings: 0,
      averageRating: 0,
      ratingDistribution: {}
    };
  }
}
