/**
 * Collections Service Module Index
 * 
 * Clean export aggregator for all collections functionality
 */

// CRUD Operations
export {
  createCollection,
  getCollection,
  updateCollection,
  deleteCollection
} from './collectionCrud';

// Book Management
export {
  addBookToCollection,
  getCollectionBooks,
  removeBookFromCollection,
  updateBookInCollection,
  isBookInCollection
} from './collectionBooks';

// Queries
export {
  getUserCollections,
  getPublicCollections,
  searchUserCollections,
  getCollectionsContainingBook
} from './collectionQueries';

// Statistics
export {
  getCollectionBookCount,
  getCollectionPreviewCovers,
  getUserCollectionStats,
  getMostPopularBooksInCollections
} from './collectionStats';

// Validation
export {
  validateCreateCollectionRequest,
  validateUpdateCollectionRequest,
  validateAddBookToCollectionRequest,
  validateCollectionAccess,
  validateCollectionQueryOptions
} from './collectionValidation';

// Types
export type {
  BookCollection,
  CollectionBook,
  CreateCollectionRequest,
  UpdateCollectionRequest,
  AddBookToCollectionRequest,
  CollectionQueryOptions,
  UserCollectionStats,
  PopularBookInCollections,
  CollectionServiceResponse,
  CollectionListResponse,
  CollectionBooksResponse
} from './types/collections';
