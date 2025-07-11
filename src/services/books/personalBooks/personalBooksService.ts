/**
 * Personal Books Service - Main Orchestrator
 * 
 * Main service orchestrator and public API for personal books functionality
 * Handles all operations related to user's personal book library
 * Completely separate from club nomination system
 */

import { BookType } from '@/types/books';
import { 
  PersonalBook, 
  AddBookToLibraryRequest, 
  PersonalBooksQueryOptions,
  UpdatePersonalBookRequest,
  LibraryStats,
  GenreStats,
  InteractionType
} from './types/personalBooks';

// Import all operations from modules
import {
  searchBooks,
  searchBooksWithFilters,
  getBookDetails,
  searchBooksByAuthor,
  searchBooksByISBN,
  getPopularBooksInCategory
} from './googleBooksApi';

import {
  addBookToLibrary,
  getUserBooks,
  getUserBook,
  isBookInLibrary,
  removeBookFromLibrary,
  updateBookInLibrary
} from './libraryOperations';

import {
  trackBookInteraction,
  getUserInteractionHistory,
  getUserInteractionStats,
  getPopularBooksFromInteractions
} from './interactionTracking';

import {
  getLibraryStats,
  getGenreStats,
  getReadingProgressStats,
  getLibraryAnalytics
} from './libraryStats';

// =====================================================
// Main Public API - Re-export all functionality
// =====================================================

// Google Books API Integration
export {
  searchBooks,
  searchBooksWithFilters,
  getBookDetails,
  searchBooksByAuthor,
  searchBooksByISBN,
  getPopularBooksInCategory
};

// Library Operations
export {
  addBookToLibrary,
  getUserBooks,
  getUserBook,
  isBookInLibrary,
  removeBookFromLibrary,
  updateBookInLibrary
};

// Interaction Tracking
export {
  trackBookInteraction,
  getUserInteractionHistory,
  getUserInteractionStats,
  getPopularBooksFromInteractions
};

// Statistics and Analytics
export {
  getLibraryStats,
  getGenreStats,
  getReadingProgressStats,
  getLibraryAnalytics
};

// Types
export type {
  PersonalBook,
  AddBookToLibraryRequest,
  PersonalBooksQueryOptions,
  UpdatePersonalBookRequest,
  LibraryStats,
  GenreStats,
  InteractionType
};

// =====================================================
// Convenience Functions
// =====================================================

/**
 * Add book from search results to library
 */
export async function addBookFromSearch(
  userId: string,
  book: BookType
): Promise<PersonalBook | null> {
  try {
    const bookData: AddBookToLibraryRequest = {
      google_books_id: book.id,
      title: book.title,
      author: book.author,
      cover_url: book.imageUrl,
      description: book.description,
      published_date: book.publishedDate,
      page_count: book.pageCount,
      genre: book.categories?.[0]
    };

    return await addBookToLibrary(userId, bookData);

  } catch (error) {
    console.error("Error adding book from search:", error);
    throw error;
  }
}

/**
 * Get user's complete library overview
 */
export async function getUserLibraryOverview(userId: string): Promise<{
  books: PersonalBook[];
  stats: LibraryStats;
  genreStats: GenreStats[];
  recentActivity: any[];
}> {
  try {
    const [books, stats, genreStats, interactionHistory] = await Promise.all([
      getUserBooks(userId, { limit: 50 }),
      getLibraryStats(userId),
      getGenreStats(userId),
      getUserInteractionHistory(userId, 10)
    ]);

    return {
      books,
      stats,
      genreStats,
      recentActivity: interactionHistory
    };

  } catch (error) {
    console.error("Error fetching user library overview:", error);
    return {
      books: [],
      stats: { totalBooks: 0, genreDistribution: {}, recentlyAdded: [] },
      genreStats: [],
      recentActivity: []
    };
  }
}

/**
 * Search and filter user's library
 */
export async function searchUserLibrary(
  userId: string,
  searchQuery: string,
  filters: {
    genre?: string;
    sortBy?: 'title' | 'author' | 'added_at';
    sortOrder?: 'asc' | 'desc';
  } = {}
): Promise<PersonalBook[]> {
  try {
    const options: PersonalBooksQueryOptions = {
      search: searchQuery,
      genre: filters.genre,
      sortBy: filters.sortBy || 'added_at',
      sortOrder: filters.sortOrder || 'desc'
    };

    return await getUserBooks(userId, options);

  } catch (error) {
    console.error("Error searching user library:", error);
    return [];
  }
}

/**
 * Get books by genre from user's library
 */
export async function getBooksByGenre(
  userId: string,
  genre: string,
  limit?: number
): Promise<PersonalBook[]> {
  try {
    const options: PersonalBooksQueryOptions = {
      genre,
      limit,
      sortBy: 'added_at',
      sortOrder: 'desc'
    };

    return await getUserBooks(userId, options);

  } catch (error) {
    console.error("Error getting books by genre:", error);
    return [];
  }
}

/**
 * Get recently added books
 */
export async function getRecentlyAddedBooks(
  userId: string,
  limit: number = 10
): Promise<PersonalBook[]> {
  try {
    const options: PersonalBooksQueryOptions = {
      limit,
      sortBy: 'added_at',
      sortOrder: 'desc'
    };

    return await getUserBooks(userId, options);

  } catch (error) {
    console.error("Error getting recently added books:", error);
    return [];
  }
}

/**
 * Bulk operations for library management
 */
export async function bulkRemoveBooks(
  userId: string,
  bookIds: string[]
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  for (const bookId of bookIds) {
    try {
      const result = await removeBookFromLibrary(userId, bookId);
      if (result) {
        success++;
      } else {
        failed++;
      }
    } catch (error) {
      console.error(`Error removing book ${bookId}:`, error);
      failed++;
    }
  }

  return { success, failed };
}

/**
 * Export user's library data
 */
export async function exportLibraryData(userId: string): Promise<{
  books: PersonalBook[];
  stats: LibraryStats;
  exportDate: string;
}> {
  try {
    const [books, stats] = await Promise.all([
      getUserBooks(userId),
      getLibraryStats(userId)
    ]);

    return {
      books,
      stats,
      exportDate: new Date().toISOString()
    };

  } catch (error) {
    console.error("Error exporting library data:", error);
    throw error;
  }
}
