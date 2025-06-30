/**
 * Personal Books Service
 * 
 * Handles all operations related to user's personal book library
 * Completely separate from club nomination system
 */

import { supabase, apiCall } from '@/lib/supabase';
import { fetchBooksByQuery } from '@/services/googleBooksService';
import { BookType } from '@/types/books';
import * as Sentry from "@sentry/react";
import {
  validateUserId,
  validatePersonalBookId,
  validateGoogleBooksId,
  validateBookTitle,
  validateBookAuthor,
  validateBookDescription,
  validateBookGenre,
  validatePageCount,
  validateISBN,
  validateOptionalRating,
  throwIfInvalid,
  validateMultiple
} from '@/lib/api/books/validation';

// =====================================================
// Types
// =====================================================

export interface PersonalBook {
  id: string;
  user_id: string;
  google_books_id: string;
  title: string;
  author: string;
  cover_url?: string;
  description?: string;
  genre?: string;
  published_date?: string;
  page_count?: number;
  isbn?: string;
  added_at: string;
  updated_at: string;
}

export interface AddBookToLibraryRequest {
  google_books_id: string;
  title: string;
  author: string;
  cover_url?: string;
  description?: string;
  genre?: string;
  published_date?: string;
  page_count?: number;
  isbn?: string;
}

export interface PersonalBooksQueryOptions {
  limit?: number;
  offset?: number;
  search?: string;
  genre?: string;
  sortBy?: 'title' | 'author' | 'added_at';
  sortOrder?: 'asc' | 'desc';
}

// =====================================================
// Google Books Search Integration
// =====================================================

/**
 * Search books using Google Books API
 * Reuses existing Google Books service
 */
export async function searchBooks(query: string, maxResults: number = 20): Promise<BookType[]> {
  try {
    if (!query || query.trim() === '') {
      return [];
    }

    console.log(`Searching books for personal library: ${query}`);
    
    const books = await fetchBooksByQuery(query, maxResults);
    
    console.log(`Found ${books.length} books for personal library search`);
    return books;
    
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        source: "personalBooksService",
        action: "searchBooks"
      },
      extra: { query, maxResults }
    });
    
    console.error("Error searching books for personal library:", error);
    throw new Error('Failed to search books. Please try again.');
  }
}

// =====================================================
// Personal Library Management
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
    const cleanedBookData = {
      ...bookData,
      author: bookData.author || 'Unknown Author',
      cover_url: bookData.cover_url || null,
      description: bookData.description || null,
      genre: bookData.genre || null,
      published_date: bookData.published_date || null,
      page_count: bookData.page_count && bookData.page_count > 0 ? bookData.page_count : null,
      isbn: bookData.isbn || null
    };

    // Input validation
    const validationResult = validateMultiple([
      { result: validateUserId(userId), field: 'userId' },
      { result: validateGoogleBooksId(cleanedBookData.google_books_id), field: 'google_books_id' },
      { result: validateBookTitle(cleanedBookData.title), field: 'title' },
      { result: validateBookAuthor(cleanedBookData.author), field: 'author' },
      { result: validateBookDescription(cleanedBookData.description), field: 'description' },
      { result: validateBookGenre(cleanedBookData.genre), field: 'genre' },
      { result: validatePageCount(cleanedBookData.page_count), field: 'page_count' },
      { result: validateISBN(cleanedBookData.isbn), field: 'isbn' }
    ]);

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
        source: "personalBooksService",
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
    throwIfInvalid(validateUserId(userId), 'userId');

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
        source: "personalBooksService",
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
    // Input validation
    throwIfInvalid(validateUserId(userId), 'userId');
    throwIfInvalid(validatePersonalBookId(bookId), 'bookId');

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
    // Input validation
    throwIfInvalid(validateUserId(userId), 'userId');
    throwIfInvalid(validateGoogleBooksId(googleBooksId), 'googleBooksId');

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
    console.error("Error checking if book is in library:", error);
    return false;
  }
}

/**
 * Remove a book from user's library
 */
export async function removeBookFromLibrary(userId: string, bookId: string): Promise<boolean> {
  try {
    // Input validation
    throwIfInvalid(validateUserId(userId), 'userId');
    throwIfInvalid(validatePersonalBookId(bookId), 'bookId');

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
      console.error('Error deleting book from database:', error);
      throw new Error('Failed to remove book from library');
    }

    // For DELETE operations, success is indicated by no error, not by data content
    // Track interaction for recommendations
    await trackBookInteraction(userId, book.google_books_id, 'removed');
    console.log(`Successfully removed book from library: ${book.title}`);

    return true;
    
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        source: "personalBooksService",
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
  updates: Partial<AddBookToLibraryRequest>
): Promise<PersonalBook | null> {
  try {
    // Input validation
    throwIfInvalid(validateUserId(userId), 'userId');
    throwIfInvalid(validatePersonalBookId(bookId), 'bookId');

    // Validate update fields if provided
    if (updates.title !== undefined) {
      throwIfInvalid(validateBookTitle(updates.title), 'title');
    }
    if (updates.author !== undefined) {
      throwIfInvalid(validateBookAuthor(updates.author), 'author');
    }
    if (updates.description !== undefined) {
      throwIfInvalid(validateBookDescription(updates.description), 'description');
    }
    if (updates.genre !== undefined) {
      throwIfInvalid(validateBookGenre(updates.genre), 'genre');
    }
    if (updates.page_count !== undefined) {
      throwIfInvalid(validatePageCount(updates.page_count), 'page_count');
    }
    if (updates.isbn !== undefined) {
      throwIfInvalid(validateISBN(updates.isbn), 'isbn');
    }

    const result = await apiCall<PersonalBook>(
      supabase
        .from('personal_books')
        .update(updates)
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

// =====================================================
// Interaction Tracking for Recommendations
// =====================================================

/**
 * Track user interaction with a book for recommendation engine
 */
export async function trackBookInteraction(
  userId: string,
  googleBooksId: string,
  interactionType: 'added' | 'removed' | 'rated' | 'reviewed' | 'completed',
  interactionValue?: number
): Promise<void> {
  try {
    // Input validation
    throwIfInvalid(validateUserId(userId), 'userId');
    throwIfInvalid(validateGoogleBooksId(googleBooksId), 'googleBooksId');

    // Validate interaction value if provided (for ratings)
    if (interactionValue !== undefined && interactionType === 'rated') {
      throwIfInvalid(validateOptionalRating(interactionValue), 'interactionValue');
    }

    await supabase
      .from('user_book_interactions')
      .insert([{
        user_id: userId,
        book_google_id: googleBooksId,
        interaction_type: interactionType,
        interaction_value: interactionValue
      }]);
      
    console.log(`Tracked ${interactionType} interaction for book ${googleBooksId}`);
    
  } catch (error) {
    // Don't throw error for interaction tracking failures
    console.error("Error tracking book interaction:", error);
  }
}

// =====================================================
// Library Statistics
// =====================================================

/**
 * Get user's library statistics
 */
export async function getLibraryStats(userId: string): Promise<{
  totalBooks: number;
  genreDistribution: Record<string, number>;
  recentlyAdded: PersonalBook[];
}> {
  try {
    // Input validation
    throwIfInvalid(validateUserId(userId), 'userId');

    const books = await getUserBooks(userId);
    
    const genreDistribution: Record<string, number> = {};
    books.forEach(book => {
      const genre = book.genre || 'Uncategorized';
      genreDistribution[genre] = (genreDistribution[genre] || 0) + 1;
    });

    const recentlyAdded = books
      .sort((a, b) => new Date(b.added_at).getTime() - new Date(a.added_at).getTime())
      .slice(0, 5);

    return {
      totalBooks: books.length,
      genreDistribution,
      recentlyAdded
    };
    
  } catch (error) {
    console.error("Error getting library stats:", error);
    return {
      totalBooks: 0,
      genreDistribution: {},
      recentlyAdded: []
    };
  }
}
