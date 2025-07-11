/**
 * Personal Books Service Module Index
 * 
 * Clean export aggregator for all personal books functionality
 */

// Main Service API
export {
  addBookFromSearch,
  getUserLibraryOverview,
  searchUserLibrary,
  getBooksByGenre,
  getRecentlyAddedBooks,
  bulkRemoveBooks,
  exportLibraryData
} from './personalBooksService';

// Google Books API Integration
export {
  searchBooks,
  searchBooksWithFilters,
  getBookDetails,
  searchBooksByAuthor,
  searchBooksByISBN,
  getPopularBooksInCategory
} from './googleBooksApi';

// Library Operations
export {
  addBookToLibrary,
  getUserBooks,
  getUserBook,
  isBookInLibrary,
  removeBookFromLibrary,
  updateBookInLibrary
} from './libraryOperations';

// Interaction Tracking
export {
  trackBookInteraction,
  getUserInteractionHistory,
  getUserInteractionStats,
  getPopularBooksFromInteractions
} from './interactionTracking';

// Statistics and Analytics
export {
  getLibraryStats,
  getGenreStats,
  getReadingProgressStats,
  getLibraryAnalytics
} from './libraryStats';

// Types
export type {
  PersonalBook,
  AddBookToLibraryRequest,
  PersonalBooksQueryOptions,
  UpdatePersonalBookRequest,
  LibraryStats,
  GenreStats,
  InteractionType,
  BookInteraction,
  PersonalBooksServiceResponse,
  LibraryResponse
} from './types/personalBooks';
