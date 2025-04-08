/**
 * Shared book-related types for Explore page and beyond
 */

export interface Book {
  id: string;            // Original Google Books ID or other source ID
  uuid?: string;         // Database UUID (if available)
  title: string;
  author?: string;
  description?: string;
  imageUrl?: string | null;
  publishedDate?: string;
  pageCount?: number;
  categories?: string[];
}

export interface BookSearchParams {
  query?: string;
  category?: string;
  sortBy?: 'relevance' | 'newest' | 'oldest';
  page?: number;
  pageSize?: number;
}

export interface BookSearchResult {
  books: Book[];
  total: number;
  page: number;
  pageSize: number;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
}

export type SortOption = 'relevance' | 'newest' | 'oldest';
