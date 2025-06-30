/**
 * Reading Lists Service
 * 
 * Handles reading list management, ratings, and reviews
 * Combined storage approach for 60% complexity reduction
 */

import { supabase, apiCall } from '@/lib/supabase';
import { PersonalBook } from './personalBooksService';
import { trackBookInteraction } from './personalBooksService';
import * as Sentry from "@sentry/react";
import {
  validateUserId,
  validatePersonalBookId,
  validateReadingStatus,
  validateRating,
  validateOptionalRating,
  validateReviewText,
  validatePrivacySetting,
  throwIfInvalid,
  validateMultiple
} from '@/lib/api/books/validation';

// =====================================================
// Types
// =====================================================

export type ReadingStatus = 'want_to_read' | 'currently_reading' | 'completed';

export interface ReadingListItem {
  id: string;
  user_id: string;
  book_id: string;
  status: ReadingStatus;
  rating?: number; // 1-5 stars
  review_text?: string;
  is_public: boolean;
  review_is_public: boolean;
  added_at: string;
  status_changed_at: string;
  rated_at?: string;
  updated_at: string;
  
  // Joined book data
  personal_books?: PersonalBook;
}

export interface AddToReadingListRequest {
  book_id: string;
  status: ReadingStatus;
  is_public?: boolean;
}

export interface UpdateReadingListRequest {
  status?: ReadingStatus;
  rating?: number;
  review_text?: string;
  is_public?: boolean;
  review_is_public?: boolean;
}

export interface ReadingListQueryOptions {
  status?: ReadingStatus;
  includePrivate?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: 'added_at' | 'status_changed_at' | 'title' | 'rating';
  sortOrder?: 'asc' | 'desc';
}

// =====================================================
// Reading List Management
// =====================================================

/**
 * Add a book to user's reading list
 */
export async function addToReadingList(
  userId: string,
  request: AddToReadingListRequest
): Promise<ReadingListItem | null> {
  try {
    // Input validation
    const validationResult = validateMultiple([
      { result: validateUserId(userId), field: 'userId' },
      { result: validatePersonalBookId(request.book_id), field: 'book_id' },
      { result: validateReadingStatus(request.status), field: 'status' },
      { result: validatePrivacySetting(request.is_public), field: 'is_public' }
    ]);

    throwIfInvalid(validationResult, 'addToReadingList');

    console.log(`Adding book to reading list for user ${userId}:`, request);

    const result = await apiCall<ReadingListItem>(
      supabase
        .from('reading_lists')
        .insert([{
          user_id: userId,
          book_id: request.book_id,
          status: request.status,
          is_public: request.is_public ?? true,
          review_is_public: true,
          status_changed_at: new Date().toISOString()
        }])
        .select(`
          *,
          personal_books (*)
        `)
        .single(),
      'Failed to add book to reading list'
    );

    if (result) {
      console.log(`Successfully added book to reading list with status: ${request.status}`);
      
      // Track interaction for recommendations
      const book = result.personal_books;
      if (book) {
        await trackBookInteraction(userId, book.google_books_id, 'added');
      }
    }

    return result;
    
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        source: "readingListsService",
        action: "addToReadingList"
      },
      extra: { userId, request }
    });
    
    console.error("Error adding to reading list:", error);
    throw error;
  }
}

/**
 * Get user's reading list with optional filtering
 */
export async function getReadingList(
  userId: string,
  options: ReadingListQueryOptions = {}
): Promise<ReadingListItem[]> {
  try {
    // Input validation
    throwIfInvalid(validateUserId(userId), 'userId');

    if (options.status) {
      throwIfInvalid(validateReadingStatus(options.status), 'status');
    }

    console.log(`Fetching reading list for user ${userId}`, options);

    let query = supabase
      .from('reading_lists')
      .select(`
        *,
        personal_books (*)
      `)
      .eq('user_id', userId);

    // Apply status filter
    if (options.status) {
      query = query.eq('status', options.status);
    }

    // Apply privacy filter (only if not including private items)
    if (!options.includePrivate) {
      query = query.eq('is_public', true);
    }

    // Apply sorting
    const sortBy = options.sortBy || 'status_changed_at';
    const sortOrder = options.sortOrder || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    if (options.limit) {
      query = query.limit(options.limit);
    }
    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
    }

    const result = await apiCall<ReadingListItem[]>(
      query,
      'Failed to load reading list'
    );

    console.log(`Loaded ${result?.length || 0} items from reading list`);
    return result || [];
    
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        source: "readingListsService",
        action: "getReadingList"
      },
      extra: { userId, options }
    });
    
    console.error("Error fetching reading list:", error);
    return [];
  }
}

/**
 * Get public reading list for profile viewing
 */
export async function getPublicReadingList(
  userId: string,
  options: ReadingListQueryOptions = {}
): Promise<ReadingListItem[]> {
  return getReadingList(userId, { ...options, includePrivate: false });
}

/**
 * Update reading list item (status, rating, review)
 */
export async function updateReadingListItem(
  userId: string,
  bookId: string,
  updates: UpdateReadingListRequest
): Promise<ReadingListItem | null> {
  try {
    // Input validation
    throwIfInvalid(validateUserId(userId), 'userId');
    throwIfInvalid(validatePersonalBookId(bookId), 'bookId');

    // Validate update fields if provided
    if (updates.status !== undefined) {
      throwIfInvalid(validateReadingStatus(updates.status), 'status');
    }
    if (updates.rating !== undefined) {
      throwIfInvalid(validateOptionalRating(updates.rating), 'rating');
    }
    if (updates.review_text !== undefined) {
      throwIfInvalid(validateReviewText(updates.review_text), 'review_text');
    }
    if (updates.is_public !== undefined) {
      throwIfInvalid(validatePrivacySetting(updates.is_public), 'is_public');
    }
    if (updates.review_is_public !== undefined) {
      throwIfInvalid(validatePrivacySetting(updates.review_is_public), 'review_is_public');
    }

    console.log(`Updating reading list item for user ${userId}, book ${bookId}:`, updates);

    // Prepare update data
    const updateData: any = { ...updates };
    
    // Update status_changed_at if status is being changed
    if (updates.status) {
      updateData.status_changed_at = new Date().toISOString();
    }
    
    // Update rated_at if rating is being added/changed
    if (updates.rating !== undefined) {
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
      'Failed to update reading list item'
    );

    if (result) {
      console.log(`Successfully updated reading list item`);
      
      // Track interactions for recommendations
      const book = result.personal_books;
      if (book) {
        if (updates.rating !== undefined) {
          await trackBookInteraction(userId, book.google_books_id, 'rated', updates.rating);
        }
        if (updates.review_text) {
          await trackBookInteraction(userId, book.google_books_id, 'reviewed');
        }
        if (updates.status === 'completed') {
          await trackBookInteraction(userId, book.google_books_id, 'completed');
        }
      }
    }

    return result;
    
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        source: "readingListsService",
        action: "updateReadingListItem"
      },
      extra: { userId, bookId, updates }
    });
    
    console.error("Error updating reading list item:", error);
    throw error;
  }
}

/**
 * Remove book from reading list
 */
export async function removeFromReadingList(userId: string, bookId: string): Promise<boolean> {
  try {
    // Input validation
    throwIfInvalid(validateUserId(userId), 'userId');
    throwIfInvalid(validatePersonalBookId(bookId), 'bookId');

    console.log(`Removing book ${bookId} from reading list for user ${userId}`);

    const result = await apiCall<any>(
      supabase
        .from('reading_lists')
        .delete()
        .eq('user_id', userId)
        .eq('book_id', bookId),
      'Failed to remove book from reading list'
    );

    if (result !== null) {
      console.log(`Successfully removed book from reading list`);
    }

    return result !== null;
    
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        source: "readingListsService",
        action: "removeFromReadingList"
      },
      extra: { userId, bookId }
    });
    
    console.error("Error removing from reading list:", error);
    return false;
  }
}

/**
 * Get reading list item by book ID
 */
export async function getReadingListItem(
  userId: string, 
  bookId: string
): Promise<ReadingListItem | null> {
  try {
    const result = await apiCall<ReadingListItem>(
      supabase
        .from('reading_lists')
        .select(`
          *,
          personal_books (*)
        `)
        .eq('user_id', userId)
        .eq('book_id', bookId)
        .single(),
      'Failed to load reading list item'
    );

    return result;
    
  } catch (error) {
    console.error("Error fetching reading list item:", error);
    return null;
  }
}

// =====================================================
// Rating and Review Operations
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

    return await updateReadingListItem(userId, bookId, {
      rating,
      review_text: reviewText,
      review_is_public: reviewIsPublic,
    });
    
  } catch (error) {
    console.error("Error rating book:", error);
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

    return result || [];
    
  } catch (error) {
    console.error("Error fetching user reviews:", error);
    return [];
  }
}

// =====================================================
// Privacy Management
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
    const updates: any = { is_public: isPublic };
    
    if (reviewIsPublic !== undefined) {
      updates.review_is_public = reviewIsPublic;
    }

    const result = await updateReadingListItem(userId, bookId, updates);
    return result !== null;
    
  } catch (error) {
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
    throwIfInvalid(validatePrivacySetting(reviewIsPublic), 'reviewIsPublic');

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
      console.log(`Successfully updated privacy for all reading list items`);
    }

    return result !== null;
    
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        source: "readingListsService",
        action: "bulkUpdatePrivacy"
      },
      extra: { userId, isPublic, reviewIsPublic }
    });
    
    console.error("Error bulk updating privacy:", error);
    return false;
  }
}

// =====================================================
// Reading Statistics
// =====================================================

/**
 * Get reading statistics for user
 */
export async function getReadingStats(userId: string): Promise<{
  totalBooks: number;
  wantToRead: number;
  currentlyReading: number;
  completed: number;
  averageRating: number;
  totalReviews: number;
}> {
  try {
    // Input validation
    throwIfInvalid(validateUserId(userId), 'userId');

    const readingList = await getReadingList(userId, { includePrivate: true });
    
    const stats = {
      totalBooks: readingList.length,
      wantToRead: readingList.filter(item => item.status === 'want_to_read').length,
      currentlyReading: readingList.filter(item => item.status === 'currently_reading').length,
      completed: readingList.filter(item => item.status === 'completed').length,
      averageRating: 0,
      totalReviews: readingList.filter(item => item.review_text).length
    };

    // Calculate average rating
    const ratedBooks = readingList.filter(item => item.rating);
    if (ratedBooks.length > 0) {
      const totalRating = ratedBooks.reduce((sum, item) => sum + (item.rating || 0), 0);
      stats.averageRating = Math.round((totalRating / ratedBooks.length) * 10) / 10;
    }

    return stats;
    
  } catch (error) {
    console.error("Error getting reading stats:", error);
    return {
      totalBooks: 0,
      wantToRead: 0,
      currentlyReading: 0,
      completed: 0,
      averageRating: 0,
      totalReviews: 0
    };
  }
}
