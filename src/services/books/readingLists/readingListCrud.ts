/**
 * Reading List CRUD Module
 * 
 * Handles basic CRUD operations for reading lists
 */

import { supabase, apiCall } from '@/lib/supabase';
import { PersonalBook, trackBookInteraction } from '../personalBooksService';
import * as Sentry from "@sentry/react";
import {
  validateUserId,
  validatePersonalBookId,
  validateReadingStatus,
  validatePrivacySetting,
  throwIfInvalid,
  validateMultiple
} from '@/lib/api/books/validation';
import {
  ReadingStatus,
  ReadingListItem,
  AddToReadingListRequest,
  UpdateReadingListRequest
} from './types/readingLists';

// =====================================================
// CRUD Operations
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
        source: "readingListCrud",
        action: "addToReadingList"
      },
      extra: { userId, request }
    });
    
    console.error("Error adding to reading list:", error);
    throw error;
  }
}

/**
 * Update reading list item
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
    if (updates.is_public !== undefined) {
      throwIfInvalid(validatePrivacySetting(updates.is_public), 'is_public');
    }
    if (updates.review_is_public !== undefined) {
      throwIfInvalid(validatePrivacySetting(updates.review_is_public), 'review_is_public');
    }

    console.log(`Updating reading list item for user ${userId}, book ${bookId}:`, updates);

    // Prepare update data
    const updateData: any = { ...updates };
    updateData.updated_at = new Date().toISOString();
    
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
        source: "readingListCrud",
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
        source: "readingListCrud",
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
    // Input validation
    throwIfInvalid(validateUserId(userId), 'userId');
    throwIfInvalid(validatePersonalBookId(bookId), 'bookId');

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

/**
 * Check if book is in reading list
 */
export async function isBookInReadingList(
  userId: string,
  bookId: string
): Promise<boolean> {
  try {
    const item = await getReadingListItem(userId, bookId);
    return item !== null;
    
  } catch (error) {
    console.error("Error checking if book is in reading list:", error);
    return false;
  }
}
