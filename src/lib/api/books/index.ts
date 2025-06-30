/**
 * Books API Index
 * 
 * Central export point for all Books Section API endpoints
 * Provides clean imports for components and other modules
 */

// Search API
export {
  searchBooks,
  getTrendingBooks,
  getBookRecommendations
} from './search';

// Library API
export {
  addBookToLibrary,
  getUserBooks,
  removeBookFromLibrary,
  isBookInLibrary,
  getLibraryStats,
  convertBookTypeToLibraryRequest,
  batchAddBooksToLibrary
} from './library';

// Reading Lists API
export {
  addToReadingList,
  getReadingList,
  getPublicReadingList,
  updateReadingListItem,
  removeFromReadingList,
  rateBook,
  getUserReviews,
  getReadingStats,
  bulkUpdatePrivacy,
  getReadingListByStatus,
  getCurrentlyReadingBooks,
  getCompletedBooks,
  getWantToReadBooks
} from './reading-lists';

// Re-export types for convenience
export type {
  PersonalBook,
  ReadingListItem,
  ReadingStatus,
  AddBookToLibraryRequest,
  AddToReadingListRequest,
  UpdateReadingListRequest,
  PersonalBooksQueryOptions,
  ReadingListQueryOptions
} from '@/services/books';

export type { BookType } from '@/types/books';

// API configuration
export const BOOKS_API_CONFIG = {
  DEFAULT_SEARCH_RESULTS: 20,
  DEFAULT_TRENDING_RESULTS: 10,
  DEFAULT_RECOMMENDATIONS: 10,
  MAX_BATCH_SIZE: 50,
  CACHE_TTL: 5 * 60 * 1000, // 5 minutes
} as const;

// API health check
export const checkBooksAPIHealth = async (): Promise<{
  search: boolean;
  library: boolean;
  readingLists: boolean;
}> => {
  try {
    // Simple health checks for each API module
    const checks = await Promise.allSettled([
      // Test search functionality
      import('./search').then(module => module.searchBooks('test', 1)),
      // Test library functionality (requires user ID, so just check import)
      import('./library').then(() => true),
      // Test reading lists functionality (requires user ID, so just check import)
      import('./reading-lists').then(() => true)
    ]);

    return {
      search: checks[0].status === 'fulfilled',
      library: checks[1].status === 'fulfilled',
      readingLists: checks[2].status === 'fulfilled'
    };
  } catch (error) {
    console.error('Books API health check failed:', error);
    return {
      search: false,
      library: false,
      readingLists: false
    };
  }
};
