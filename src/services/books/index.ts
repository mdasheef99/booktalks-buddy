/**
 * Books Services Index
 * 
 * Central export point for all Books Section services
 * Provides clean imports for components and other services
 */

// Personal Books Service
export {
  searchBooks,
  addBookToLibrary,
  getUserBooks,
  getUserBook,
  isBookInLibrary,
  removeBookFromLibrary,
  updateBookInLibrary,
  trackBookInteraction,
  getLibraryStats
} from './personalBooksService';

export type {
  PersonalBook,
  AddBookToLibraryRequest,
  PersonalBooksQueryOptions
} from './personalBooksService';

// Reading Lists Service
export {
  addToReadingList,
  getReadingList,
  getPublicReadingList,
  updateReadingListItem,
  removeFromReadingList,
  getReadingListItem,
  rateBook,
  getUserReviews,
  updateItemPrivacy,
  bulkUpdatePrivacy,
  getReadingStats
} from './readingListsService';

export type {
  ReadingStatus,
  ReadingListItem,
  AddToReadingListRequest,
  UpdateReadingListRequest,
  ReadingListQueryOptions
} from './readingListsService';

// Collections Service
export {
  createCollection,
  getUserCollections,
  getPublicCollections,
  getCollection,
  updateCollection,
  deleteCollection,
  addBookToCollection,
  getCollectionBooks,
  removeBookFromCollection,
  updateBookInCollection,
  isBookInCollection
} from './collectionsService';

export type {
  BookCollection,
  CollectionBook,
  CreateCollectionRequest,
  UpdateCollectionRequest,
  AddBookToCollectionRequest,
  CollectionQueryOptions
} from './collectionsService';

// Store Requests Service
export {
  createAuthenticatedStoreRequest,
  requestBookFromStore,
  getUserStoreRequests,
  getStoreRequest,
  cancelStoreRequest,
  getStoreRequests,
  updateStoreRequestStatus,
  getUserRequestStats,
  getStoreRequestStats,
  getAvailableStores,
  getUserStoreId,
  getUserStoreContext
} from './storeRequestsService';

export type {
  BookAvailabilityRequest,
  CreateStoreRequestRequest,
  StoreRequestQueryOptions
} from './storeRequestsService';

// Re-export Google Books types for convenience
export type { BookType } from '@/types/books';

// Service configuration and constants
export const BOOKS_SERVICE_CONFIG = {
  DEFAULT_SEARCH_LIMIT: 20,
  DEFAULT_LIBRARY_PAGE_SIZE: 50,
  DEFAULT_COLLECTION_PAGE_SIZE: 20,
  MAX_COLLECTION_NAME_LENGTH: 100,
  MAX_REVIEW_LENGTH: 2000,
  MAX_COLLECTION_DESCRIPTION_LENGTH: 500,
  MAX_COLLECTION_NOTES_LENGTH: 500
} as const;

// Service status and health check
export const checkBooksServiceHealth = async (): Promise<{
  personalBooks: boolean;
  readingLists: boolean;
  collections: boolean;
  storeRequests: boolean;
}> => {
  try {
    // Simple health checks for each service
    const checks = await Promise.allSettled([
      // Check personal_books table
      import('@/lib/supabase').then(({ supabase }) => 
        supabase.from('personal_books').select('id').limit(1)
      ),
      // Check reading_lists table
      import('@/lib/supabase').then(({ supabase }) => 
        supabase.from('reading_lists').select('id').limit(1)
      ),
      // Check book_collections table
      import('@/lib/supabase').then(({ supabase }) => 
        supabase.from('book_collections').select('id').limit(1)
      ),
      // Check book_availability_requests table
      import('@/lib/supabase').then(({ supabase }) => 
        supabase.from('book_availability_requests').select('id').limit(1)
      )
    ]);

    return {
      personalBooks: checks[0].status === 'fulfilled',
      readingLists: checks[1].status === 'fulfilled',
      collections: checks[2].status === 'fulfilled',
      storeRequests: checks[3].status === 'fulfilled'
    };
  } catch (error) {
    console.error('Books service health check failed:', error);
    return {
      personalBooks: false,
      readingLists: false,
      collections: false,
      storeRequests: false
    };
  }
};
