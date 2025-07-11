/**
 * Library Operations Module
 * 
 * Personal library CRUD operations
 */

import { supabase, apiCall } from '@/lib/supabase';
import * as Sentry from "@sentry/react";
import { throwIfInvalid } from '@/lib/api/books/validation';
import { 
  PersonalBook, 
  AddBookToLibraryRequest, 
  PersonalBooksQueryOptions,
  UpdatePersonalBookRequest
} from './types/personalBooks';
import { 
  validateAddBookRequest, 
  validateUpdateBookRequest, 
  validateQueryOptions,
  cleanBookData,
  cleanUpdateData
} from './bookValidation';
import { trackBookInteraction } from './interactionTracking';

// =====================================================
// Library CRUD Operations
// =====================================================

/**
 * Add a book to user's personal library
 */
export async function addBookToLibrary(
  userId: string,
  bookData: AddBookToLibraryRequest
): Promise<PersonalBook | null> {
  try {
    // Clean the data before validation
    const cleanedBookData = cleanBookData(bookData);

    // Validate input
    const validationResult = validateAddBookRequest(userId, cleanedBookData);
    throwIfInvalid(validationResult, 'addBookToLibrary');

    console.log(`Adding book to personal library for user ${userId}:`, cleanedBookData.title);

    // Check if book already exists to prevent duplicates
    const { data: existingBooks, error: checkError } = await supabase
      .from('personal_books')
      .select('*')
      .eq('user_id', userId)
      .eq('google_books_id', cleanedBookData.google_books_id);

    if (checkError) {
      console.error('Error checking for existing book:', checkError);
      throw new Error('Failed to check for existing book');
    }

    if (existingBooks && existingBooks.length > 0) {
      console.log(`Book already exists in library: ${cleanedBookData.title}`);
      return existingBooks[0];
    }

    const result = await apiCall<PersonalBook>(
      supabase
        .from('personal_books')
        .insert([{
          user_id: userId,
          google_books_id: cleanedBookData.google_books_id,
          title: cleanedBookData.title,
          author: cleanedBookData.author,
          cover_url: cleanedBookData.cover_url,
          description: cleanedBookData.description,
          genre: cleanedBookData.genre,
          published_date: cleanedBookData.published_date,
          page_count: cleanedBookData.page_count,
          isbn: cleanedBookData.isbn
        }])
        .select()
        .single(),
      'Failed to add book to your library'
    );

    if (result) {
      console.log(`Successfully added book to library: ${result.title}`);
      
      // Track interaction for recommendations
      await trackBookInteraction(userId, bookData.google_books_id, 'added');
    }

    return result;
    
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        source: "personalBooks/libraryOperations",
        action: "addBookToLibrary"
      },
      extra: { userId, bookData }
    });
    
    console.error("Error adding book to library:", error);
    throw error;
  }
}

/**
 * Get user's personal book library
 */
export async function getUserBooks(
  userId: string,
  options: PersonalBooksQueryOptions = {}
): Promise<PersonalBook[]> {
  try {
    // Input validation
    throwIfInvalid(validateQueryOptions(options), 'getUserBooks');

    console.log(`Fetching personal library for user ${userId}`);

    let query = supabase
      .from('personal_books')
      .select('*')
      .eq('user_id', userId);

    // Apply search filter
    if (options.search) {
      query = query.or(`title.ilike.%${options.search}%,author.ilike.%${options.search}%`);
    }

    // Apply genre filter
    if (options.genre) {
      query = query.eq('genre', options.genre);
    }

    // Apply sorting
    const sortBy = options.sortBy || 'added_at';
    const sortOrder = options.sortOrder || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    if (options.limit) {
      query = query.limit(options.limit);
    }
    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
    }

    const result = await apiCall<PersonalBook[]>(
      query,
      'Failed to load your book library'
    );

    console.log(`Loaded ${result?.length || 0} books from personal library`);
    return result || [];
    
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        source: "personalBooks/libraryOperations",
        action: "getUserBooks"
      },
      extra: { userId, options }
    });
    
    console.error("Error fetching user books:", error);
    return [];
  }
}

/**
 * Get a specific book from user's library
 */
export async function getUserBook(userId: string, bookId: string): Promise<PersonalBook | null> {
  try {
    const result = await apiCall<PersonalBook>(
      supabase
        .from('personal_books')
        .select('*')
        .eq('user_id', userId)
        .eq('id', bookId)
        .single(),
      'Failed to load book details'
    );

    return result;
    
  } catch (error) {
    console.error("Error fetching user book:", error);
    return null;
  }
}

/**
 * Check if a book exists in user's library
 */
export async function isBookInLibrary(userId: string, googleBooksId: string): Promise<boolean> {
  try {
    // Use direct query without .single() to avoid PGRST116 error when book doesn't exist
    const { data, error } = await supabase
      .from('personal_books')
      .select('id')
      .eq('user_id', userId)
      .eq('google_books_id', googleBooksId);

    if (error) {
      console.error("Error checking if book is in library:", error);
      return false;
    }

    // Return true if any rows found, false if empty array
    return data && data.length > 0;
    
  } catch (error) {
    console.error("Error checking book existence:", error);
    return false;
  }
}

/**
 * Remove a book from user's library
 */
export async function removeBookFromLibrary(userId: string, bookId: string): Promise<boolean> {
  try {
    console.log(`Removing book ${bookId} from library for user ${userId}`);

    // Get book details before deletion for interaction tracking
    const book = await getUserBook(userId, bookId);

    if (!book) {
      console.log(`Book ${bookId} not found in user ${userId}'s library`);
      return false;
    }

    // Perform the deletion
    const { data, error } = await supabase
      .from('personal_books')
      .delete()
      .eq('user_id', userId)
      .eq('id', bookId);

    if (error) {
      console.error('Error removing book from library:', error);
      throw new Error('Failed to remove book from library');
    }

    console.log(`Successfully removed book from library: ${book.title}`);

    // Track interaction for recommendations
    await trackBookInteraction(userId, book.google_books_id, 'removed');

    return true;
    
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        source: "personalBooks/libraryOperations",
        action: "removeBookFromLibrary"
      },
      extra: { userId, bookId }
    });
    
    console.error("Error removing book from library:", error);
    return false;
  }
}

/**
 * Update book details in user's library
 */
export async function updateBookInLibrary(
  userId: string,
  bookId: string,
  updates: UpdatePersonalBookRequest
): Promise<PersonalBook | null> {
  try {
    // Clean and validate the updates
    const cleanedUpdates = cleanUpdateData(updates);
    const validationResult = validateUpdateBookRequest(userId, bookId, cleanedUpdates);
    throwIfInvalid(validationResult, 'updateBookInLibrary');

    const result = await apiCall<PersonalBook>(
      supabase
        .from('personal_books')
        .update(cleanedUpdates)
        .eq('user_id', userId)
        .eq('id', bookId)
        .select()
        .single(),
      'Failed to update book details'
    );

    return result;
    
  } catch (error) {
    console.error("Error updating book in library:", error);
    return null;
  }
}
