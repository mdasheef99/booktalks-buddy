/**
 * Personal Books Types Module
 * 
 * Service-specific types and interfaces for personal books functionality
 */

// =====================================================
// Core Types
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
// Update Types
// =====================================================

export interface UpdatePersonalBookRequest {
  title?: string;
  author?: string;
  cover_url?: string;
  description?: string;
  genre?: string;
  published_date?: string;
  page_count?: number;
  isbn?: string;
}

// =====================================================
// Statistics Types
// =====================================================

export interface LibraryStats {
  totalBooks: number;
  genreDistribution: Record<string, number>;
  recentlyAdded: PersonalBook[];
}

export interface GenreStats {
  genre: string;
  count: number;
  percentage: number;
}

// =====================================================
// Interaction Tracking Types
// =====================================================

export type InteractionType = 'added' | 'removed' | 'rated' | 'reviewed' | 'completed';

export interface BookInteraction {
  user_id: string;
  google_books_id: string;
  interaction_type: InteractionType;
  interaction_value?: number;
  created_at: string;
}

// =====================================================
// Service Response Types
// =====================================================

export interface PersonalBooksServiceResponse<T> {
  data: T | null;
  error?: string;
  success: boolean;
}

export interface LibraryResponse {
  books: PersonalBook[];
  total: number;
  hasMore: boolean;
}
