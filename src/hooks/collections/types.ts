/**
 * Collections Hooks Types
 * 
 * TypeScript interfaces for all collections hooks
 */

import { BookCollection, CollectionBook, CreateCollectionRequest, UpdateCollectionRequest } from '@/services/books/collections';

// =====================================================
// Common Hook Options
// =====================================================

export interface CollectionHookOptions {
  enabled?: boolean;
  refetchOnWindowFocus?: boolean;
  refetchInterval?: number;
}

// =====================================================
// useCollections Hook Types
// =====================================================

export interface UseCollectionsReturn {
  collections: BookCollection[];
  loading: boolean;
  error: string | null;
  refreshCollections: () => Promise<void>;
  createCollection: (data: CreateCollectionRequest) => Promise<BookCollection>;
  updateCollection: (collectionId: string, data: UpdateCollectionRequest) => Promise<BookCollection>;
  deleteCollection: (collectionId: string) => Promise<void>;
}

// =====================================================
// useCollectionBooks Hook Types
// =====================================================

export interface UseCollectionBooksReturn {
  books: CollectionBook[];
  loading: boolean;
  error: string | null;
  refreshBooks: () => Promise<void>;
  addBook: (bookId: string, notes?: string) => Promise<void>;
  removeBook: (bookId: string) => Promise<void>;
  updateBookNotes: (bookId: string, notes: string) => Promise<void>;
  isBookInCollection: (bookId: string) => boolean;
}

// =====================================================
// useCollectionActions Hook Types
// =====================================================

export interface UseCollectionActionsReturn {
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  createCollection: (userId: string, data: CreateCollectionRequest) => Promise<BookCollection>;
  updateCollection: (collectionId: string, data: UpdateCollectionRequest) => Promise<BookCollection>;
  deleteCollection: (collectionId: string) => Promise<void>;
  addBookToCollection: (collectionId: string, bookId: string, notes?: string) => Promise<void>;
  removeBookFromCollection: (collectionId: string, bookId: string) => Promise<void>;
}
