/**
 * Store Requests Types Module
 * 
 * Service-specific types and interfaces for store requests functionality
 */

import { PersonalBook } from '../../personalBooksService';

// =====================================================
// Core Types
// =====================================================

export interface BookAvailabilityRequest {
  id: string;
  store_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  book_title: string;
  book_author: string;
  description?: string;
  status: 'pending' | 'responded' | 'resolved';
  store_response?: string;
  created_at: string;
  responded_at?: string;
  
  // New fields for authenticated users
  user_id?: string;
  google_books_id?: string;
  request_source: 'anonymous' | 'authenticated_user';
  
  // Joined data
  personal_books?: PersonalBook;
  stores?: {
    id: string;
    name: string;
  };
}

export interface CreateStoreRequestRequest {
  book_title: string;
  book_author: string;
  description?: string;
  google_books_id?: string; // For authenticated users
}

export interface StoreRequestQueryOptions {
  status?: 'pending' | 'responded' | 'resolved';
  store_id?: string;
  request_source?: 'anonymous' | 'authenticated_user';
  limit?: number;
  offset?: number;
  sortBy?: 'created_at' | 'responded_at' | 'status';
  sortOrder?: 'asc' | 'desc';
}

// =====================================================
// Statistics Types
// =====================================================

export interface UserRequestStats {
  totalRequests: number;
  pendingRequests: number;
  respondedRequests: number;
  resolvedRequests: number;
  // Legacy fields for backward compatibility
  availableBooks: number;
  unavailableBooks: number;
  orderedBooks: number;
}

export interface StoreRequestStats {
  totalRequests: number;
  authenticatedRequests: number;
  anonymousRequests: number;
  pendingRequests: number;
  respondedRequests: number;
}

// =====================================================
// Context Types
// =====================================================

export interface UserStoreContext {
  store_id: string;
  store_name: string;
}

export interface AvailableStore {
  id: string;
  name: string;
}

// =====================================================
// Status Types
// =====================================================

export type RequestStatus = 'pending' | 'responded' | 'resolved';
export type StoreResponseStatus = 'available' | 'unavailable' | 'ordered';
export type RequestSource = 'anonymous' | 'authenticated_user';
