/**
 * Reading Lists API
 * 
 * API endpoints for reading list management, ratings, and reviews
 * Wraps the reading lists services with additional API-level functionality
 */

import {
  ReadingStatus,
  ReadingListItem,
  AddToReadingListRequest,
  UpdateReadingListRequest,
  ReadingListQueryOptions,
  addToReadingList as addToReadingListService,
  getReadingList as getReadingListService,
  getPublicReadingList as getPublicReadingListService,
  updateReadingListItem as updateReadingListItemService,
  removeFromReadingList as removeFromReadingListService,
  rateBook as rateBookService,
  getUserReviews as getUserReviewsService,
  getReadingStats as getReadingStatsService,
  bulkUpdatePrivacy as bulkUpdatePrivacyService
} from '@/services/books';

/**
 * Add a book to user's reading list
 * @param userId User ID
 * @param request Reading list request data
 * @returns Promise<ReadingListItem | null>
 */
export async function addToReadingList(
  userId: string,
  request: AddToReadingListRequest
): Promise<ReadingListItem | null> {
  try {
    console.log(`API: Adding book to reading list for user ${userId}:`, request);
    
    const result = await addToReadingListService(userId, request);
    
    if (result) {
      console.log(`API: Successfully added book to reading list with status: ${request.status}`);
    }
    
    return result;
    
  } catch (error) {
    console.error('API: Error adding to reading list:', error);
    throw new Error('Failed to add book to reading list. Please try again.');
  }
}

/**
 * Get user's reading list
 * @param userId User ID
 * @param options Query options
 * @returns Promise<ReadingListItem[]>
 */
export async function getReadingList(
  userId: string,
  options: ReadingListQueryOptions = {}
): Promise<ReadingListItem[]> {
  try {
    console.log(`API: Fetching reading list for user ${userId}`, options);
    
    const items = await getReadingListService(userId, options);
    
    console.log(`API: Found ${items.length} items in reading list`);
    return items;
    
  } catch (error) {
    console.error('API: Error fetching reading list:', error);
    throw new Error('Failed to load reading list. Please try again.');
  }
}

/**
 * Get public reading list for profile viewing
 * @param userId User ID
 * @param options Query options
 * @returns Promise<ReadingListItem[]>
 */
export async function getPublicReadingList(
  userId: string,
  options: ReadingListQueryOptions = {}
): Promise<ReadingListItem[]> {
  try {
    console.log(`API: Fetching public reading list for user ${userId}`);
    
    const items = await getPublicReadingListService(userId, options);
    
    console.log(`API: Found ${items.length} public items in reading list`);
    return items;
    
  } catch (error) {
    console.error('API: Error fetching public reading list:', error);
    throw new Error('Failed to load public reading list. Please try again.');
  }
}

/**
 * Update reading list item
 * @param userId User ID
 * @param bookId Book ID
 * @param updates Update data
 * @returns Promise<ReadingListItem | null>
 */
export async function updateReadingListItem(
  userId: string,
  bookId: string,
  updates: UpdateReadingListRequest
): Promise<ReadingListItem | null> {
  try {
    console.log(`API: Updating reading list item for user ${userId}, book ${bookId}:`, updates);
    
    const result = await updateReadingListItemService(userId, bookId, updates);
    
    if (result) {
      console.log(`API: Successfully updated reading list item`);
    }
    
    return result;
    
  } catch (error) {
    console.error('API: Error updating reading list item:', error);
    throw new Error('Failed to update reading list item. Please try again.');
  }
}

/**
 * Remove book from reading list
 * @param userId User ID
 * @param bookId Book ID
 * @returns Promise<boolean>
 */
export async function removeFromReadingList(
  userId: string,
  bookId: string
): Promise<boolean> {
  try {
    console.log(`API: Removing book ${bookId} from reading list for user ${userId}`);
    
    const success = await removeFromReadingListService(userId, bookId);
    
    if (success) {
      console.log(`API: Successfully removed book from reading list`);
    }
    
    return success;
    
  } catch (error) {
    console.error('API: Error removing from reading list:', error);
    throw new Error('Failed to remove book from reading list. Please try again.');
  }
}

/**
 * Rate a book
 * @param userId User ID
 * @param bookId Book ID
 * @param rating Rating (1-5)
 * @param reviewText Optional review text
 * @param reviewIsPublic Whether review is public
 * @returns Promise<ReadingListItem | null>
 */
export async function rateBook(
  userId: string,
  bookId: string,
  rating: number,
  reviewText?: string,
  reviewIsPublic: boolean = true
): Promise<ReadingListItem | null> {
  try {
    console.log(`API: Rating book ${bookId} for user ${userId}: ${rating} stars`);
    
    const result = await rateBookService(userId, bookId, rating, reviewText, reviewIsPublic);
    
    if (result) {
      console.log(`API: Successfully rated book`);
    }
    
    return result;
    
  } catch (error) {
    console.error('API: Error rating book:', error);
    throw new Error('Failed to rate book. Please try again.');
  }
}

/**
 * Get user's reviews
 * @param userId User ID
 * @param includePrivate Whether to include private reviews
 * @param limit Maximum number of reviews
 * @returns Promise<ReadingListItem[]>
 */
export async function getUserReviews(
  userId: string,
  includePrivate: boolean = false,
  limit: number = 10
): Promise<ReadingListItem[]> {
  try {
    console.log(`API: Fetching reviews for user ${userId}`);
    
    const reviews = await getUserReviewsService(userId, includePrivate, limit);
    
    console.log(`API: Found ${reviews.length} reviews`);
    return reviews;
    
  } catch (error) {
    console.error('API: Error fetching user reviews:', error);
    throw new Error('Failed to load reviews. Please try again.');
  }
}

/**
 * Get reading statistics
 * @param userId User ID
 * @returns Promise<ReadingStats>
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
    console.log(`API: Getting reading stats for user ${userId}`);
    
    const stats = await getReadingStatsService(userId);
    
    console.log(`API: User has read ${stats.completed} books with average rating ${stats.averageRating}`);
    return stats;
    
  } catch (error) {
    console.error('API: Error getting reading stats:', error);
    throw new Error('Failed to load reading statistics. Please try again.');
  }
}

/**
 * Update privacy settings for all reading list items
 * @param userId User ID
 * @param isPublic Whether items should be public
 * @param reviewIsPublic Whether reviews should be public
 * @returns Promise<boolean>
 */
export async function bulkUpdatePrivacy(
  userId: string,
  isPublic: boolean,
  reviewIsPublic?: boolean
): Promise<boolean> {
  try {
    console.log(`API: Bulk updating privacy for user ${userId}: public=${isPublic}`);
    
    const success = await bulkUpdatePrivacyService(userId, isPublic, reviewIsPublic);
    
    if (success) {
      console.log(`API: Successfully updated privacy settings`);
    }
    
    return success;
    
  } catch (error) {
    console.error('API: Error updating privacy settings:', error);
    throw new Error('Failed to update privacy settings. Please try again.');
  }
}

/**
 * Get reading list by status
 * @param userId User ID
 * @param status Reading status to filter by
 * @returns Promise<ReadingListItem[]>
 */
export async function getReadingListByStatus(
  userId: string,
  status: ReadingStatus
): Promise<ReadingListItem[]> {
  try {
    return await getReadingList(userId, { status, includePrivate: true });
  } catch (error) {
    console.error(`API: Error fetching ${status} books:`, error);
    throw new Error(`Failed to load ${status.replace('_', ' ')} books. Please try again.`);
  }
}

/**
 * Get currently reading books
 * @param userId User ID
 * @returns Promise<ReadingListItem[]>
 */
export async function getCurrentlyReadingBooks(userId: string): Promise<ReadingListItem[]> {
  return getReadingListByStatus(userId, 'currently_reading');
}

/**
 * Get completed books
 * @param userId User ID
 * @returns Promise<ReadingListItem[]>
 */
export async function getCompletedBooks(userId: string): Promise<ReadingListItem[]> {
  return getReadingListByStatus(userId, 'completed');
}

/**
 * Get want to read books
 * @param userId User ID
 * @returns Promise<ReadingListItem[]>
 */
export async function getWantToReadBooks(userId: string): Promise<ReadingListItem[]> {
  return getReadingListByStatus(userId, 'want_to_read');
}
