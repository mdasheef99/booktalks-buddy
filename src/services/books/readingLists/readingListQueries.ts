/**
 * Reading List Queries Module
 * 
 * Handles complex queries and data aggregation for reading lists
 */

import { supabase, apiCall } from '@/lib/supabase';
import { PersonalBook } from '../personalBooksService';
import * as Sentry from "@sentry/react";
import {
  validateUserId,
  validateReadingStatus,
  throwIfInvalid
} from '@/lib/api/books/validation';
import {
  ReadingStatus,
  ReadingListItem,
  ReadingListQueryOptions
} from './types/readingLists';

// =====================================================
// Query Functions
// =====================================================

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
        personal_books!inner (*)
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
    
    if (sortBy === 'title') {
      // Sort by book title (requires join)
      query = query.order('personal_books.title', { ascending: sortOrder === 'asc' });
    } else {
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });
    }

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

    console.log(`Loaded ${result?.length || 0} reading list items`);
    return result || [];
    
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        source: "readingListQueries",
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
 * Get reading statistics for user
 */
export async function getReadingStats(userId: string): Promise<{
  totalBooks: number;
  wantToRead: number;
  currentlyReading: number;
  completed: number;
  totalRatings: number;
  averageRating: number;
  totalReviews: number;
}> {
  try {
    // Input validation
    throwIfInvalid(validateUserId(userId), 'userId');

    const { data, error } = await supabase
      .from('reading_lists')
      .select('status, rating, review_text')
      .eq('user_id', userId);

    if (error) {
      console.error("Error getting reading stats:", error);
      return {
        totalBooks: 0,
        wantToRead: 0,
        currentlyReading: 0,
        completed: 0,
        totalRatings: 0,
        averageRating: 0,
        totalReviews: 0
      };
    }

    const items = data || [];
    const totalBooks = items.length;
    
    // Count by status
    const wantToRead = items.filter(item => item.status === 'want_to_read').length;
    const currentlyReading = items.filter(item => item.status === 'currently_reading').length;
    const completed = items.filter(item => item.status === 'completed').length;
    
    // Rating statistics
    const ratedItems = items.filter(item => item.rating !== null);
    const totalRatings = ratedItems.length;
    const averageRating = totalRatings > 0 
      ? Math.round((ratedItems.reduce((sum, item) => sum + (item.rating || 0), 0) / totalRatings) * 10) / 10
      : 0;
    
    // Review statistics
    const totalReviews = items.filter(item => item.review_text && item.review_text.trim().length > 0).length;

    return {
      totalBooks,
      wantToRead,
      currentlyReading,
      completed,
      totalRatings,
      averageRating,
      totalReviews
    };
    
  } catch (error) {
    console.error("Error getting reading stats:", error);
    return {
      totalBooks: 0,
      wantToRead: 0,
      currentlyReading: 0,
      completed: 0,
      totalRatings: 0,
      averageRating: 0,
      totalReviews: 0
    };
  }
}

/**
 * Search reading list by book title or author
 */
export async function searchReadingList(
  userId: string,
  searchTerm: string,
  options: ReadingListQueryOptions = {}
): Promise<ReadingListItem[]> {
  try {
    // Input validation
    throwIfInvalid(validateUserId(userId), 'userId');

    if (!searchTerm || searchTerm.trim().length === 0) {
      return getReadingList(userId, options);
    }

    console.log(`Searching reading list for user ${userId} with term: ${searchTerm}`);

    const searchLower = searchTerm.toLowerCase().trim();

    let query = supabase
      .from('reading_lists')
      .select(`
        *,
        personal_books!inner (*)
      `)
      .eq('user_id', userId)
      .or(`personal_books.title.ilike.%${searchLower}%,personal_books.author.ilike.%${searchLower}%`);

    // Apply status filter
    if (options.status) {
      query = query.eq('status', options.status);
    }

    // Apply privacy filter
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
      'Failed to search reading list'
    );

    console.log(`Found ${result?.length || 0} reading list items matching search`);
    return result || [];
    
  } catch (error) {
    console.error("Error searching reading list:", error);
    return [];
  }
}

/**
 * Get recently updated reading list items
 */
export async function getRecentlyUpdated(
  userId: string,
  limit: number = 10
): Promise<ReadingListItem[]> {
  try {
    return getReadingList(userId, {
      sortBy: 'updated_at',
      sortOrder: 'desc',
      limit,
      includePrivate: true
    });
    
  } catch (error) {
    console.error("Error getting recently updated items:", error);
    return [];
  }
}
