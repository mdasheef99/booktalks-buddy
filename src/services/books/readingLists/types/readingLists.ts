/**
 * Reading Lists Service Types
 * 
 * Type definitions for reading lists service modules
 */

import { PersonalBook } from '../../personalBooksService';

// =====================================================
// Core Reading List Types
// =====================================================

export type ReadingStatus = 'want_to_read' | 'currently_reading' | 'completed';

export interface ReadingListItem {
  id: string;
  user_id: string;
  book_id: string;
  status: ReadingStatus;
  rating?: number;
  review_text?: string;
  is_public: boolean;
  review_is_public: boolean;
  added_at: string;
  status_changed_at: string;
  rated_at?: string;
  updated_at: string;
  
  // Joined book data
  personal_books?: PersonalBook;
}

// =====================================================
// Request Types
// =====================================================

export interface AddToReadingListRequest {
  book_id: string;
  status: ReadingStatus;
  is_public?: boolean;
}

export interface UpdateReadingListRequest {
  status?: ReadingStatus;
  rating?: number;
  review_text?: string;
  is_public?: boolean;
  review_is_public?: boolean;
}

// =====================================================
// Query Options
// =====================================================

export interface ReadingListQueryOptions {
  status?: ReadingStatus;
  includePrivate?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: 'added_at' | 'status_changed_at' | 'title' | 'rating';
  sortOrder?: 'asc' | 'desc';
}

// =====================================================
// Statistics Types
// =====================================================

export interface ReadingStats {
  totalBooks: number;
  wantToRead: number;
  currentlyReading: number;
  completed: number;
  totalRatings: number;
  averageRating: number;
  totalReviews: number;
}

export interface RatingStats {
  totalRatings: number;
  averageRating: number;
  ratingDistribution: Record<number, number>;
  mostRecentRating?: ReadingListItem;
}

export interface ReviewStats {
  totalReviews: number;
  publicReviews: number;
  privateReviews: number;
  averageReviewLength: number;
  mostRecentReview?: ReadingListItem;
}

export interface PrivacyStats {
  totalItems: number;
  publicItems: number;
  privateItems: number;
  publicReviews: number;
  privateReviews: number;
}

// =====================================================
// Service Response Types
// =====================================================

export interface ReadingListServiceResponse<T> {
  data: T | null;
  error?: string;
  success: boolean;
}

export interface ReadingListResponse {
  items: ReadingListItem[];
  total: number;
  hasMore: boolean;
}

// =====================================================
// Filter and Search Types
// =====================================================

export interface ReadingListFilters {
  status?: ReadingStatus;
  hasRating?: boolean;
  hasReview?: boolean;
  isPublic?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface ReadingListSearchOptions extends ReadingListQueryOptions {
  searchTerm?: string;
  searchFields?: ('title' | 'author' | 'review')[];
}
