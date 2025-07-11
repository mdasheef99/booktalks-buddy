/**
 * Collections Service Types
 * 
 * Type definitions for collections service modules
 */

import { PersonalBook } from '../../personalBooksService';

// =====================================================
// Core Collection Types
// =====================================================

export interface BookCollection {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  
  // Computed fields
  book_count?: number;
  preview_covers?: string[];
}

export interface CollectionBook {
  id: string;
  collection_id: string;
  book_id: string;
  notes?: string;
  added_at: string;
  
  // Joined book data
  personal_books?: PersonalBook;
}

// =====================================================
// Request Types
// =====================================================

export interface CreateCollectionRequest {
  name: string;
  description?: string;
  is_public?: boolean;
}

export interface UpdateCollectionRequest {
  name?: string;
  description?: string;
  is_public?: boolean;
}

export interface AddBookToCollectionRequest {
  book_id: string;
  notes?: string;
}

// =====================================================
// Query Options
// =====================================================

export interface CollectionQueryOptions {
  includePrivate?: boolean;
  includeBookCount?: boolean;
  includePreviewCovers?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: 'name' | 'created_at' | 'updated_at' | 'book_count';
  sortOrder?: 'asc' | 'desc';
}

// =====================================================
// Statistics Types
// =====================================================

export interface UserCollectionStats {
  totalCollections: number;
  publicCollections: number;
  privateCollections: number;
  totalBooksInCollections: number;
  averageBooksPerCollection: number;
}

export interface PopularBookInCollections {
  book_id: string;
  collection_count: number;
  personal_books?: PersonalBook;
}

// =====================================================
// Service Response Types
// =====================================================

export interface CollectionServiceResponse<T> {
  data: T | null;
  error?: string;
  success: boolean;
}

export interface CollectionListResponse {
  collections: BookCollection[];
  total: number;
  hasMore: boolean;
}

export interface CollectionBooksResponse {
  books: CollectionBook[];
  total: number;
  hasMore: boolean;
}
