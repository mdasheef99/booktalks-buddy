/**
 * Store Requests Service - Main Orchestrator
 * 
 * Main service orchestrator and public API for store requests functionality
 * Extends existing book availability request system for authenticated users
 * Integrates with personal books library for seamless book requesting
 */

import { PersonalBook } from '../personalBooksService';
import { 
  BookAvailabilityRequest, 
  CreateStoreRequestRequest, 
  StoreRequestQueryOptions,
  UserRequestStats,
  StoreRequestStats,
  UserStoreContext,
  AvailableStore,
  StoreResponseStatus
} from './types/storeRequests';

// Import all operations from modules
import {
  createAuthenticatedStoreRequest,
  getUserStoreRequests,
  getStoreRequest,
  cancelStoreRequest,
  getStoreRequests,
  updateStoreRequestStatus,
  getUserRequestStats,
  getStoreRequestStats
} from './requestOperations';

import {
  getUserStoreId,
  getUserStoreContext,
  validateUserStoreAccess,
  userBelongsToStore,
  getUserClubInfo
} from './userContextService';

import {
  getAvailableStores,
  getStoreById,
  validateStoreExists,
  getStoresByClub,
  searchStores,
  getStoreStats,
  isStoreAcceptingRequests
} from './storeResolution';

// =====================================================
// Main Public API - User Operations
// =====================================================

/**
 * Create store request from personal book
 */
export async function requestBookFromStore(
  userId: string,
  userEmail: string,
  userName: string,
  personalBook: PersonalBook,
  additionalNotes?: string
): Promise<BookAvailabilityRequest | null> {
  try {
    const request: CreateStoreRequestRequest = {
      book_title: personalBook.title,
      book_author: personalBook.author,
      description: additionalNotes,
      google_books_id: personalBook.google_books_id
    };

    return await createAuthenticatedStoreRequest(userId, userEmail, userName, request);

  } catch (error) {
    console.error("Error requesting book from store:", error);
    throw error;
  }
}

/**
 * Create custom store request
 */
export async function createCustomStoreRequest(
  userId: string,
  userEmail: string,
  userName: string,
  bookTitle: string,
  bookAuthor: string,
  description?: string
): Promise<BookAvailabilityRequest | null> {
  try {
    const request: CreateStoreRequestRequest = {
      book_title: bookTitle,
      book_author: bookAuthor,
      description: description
    };

    return await createAuthenticatedStoreRequest(userId, userEmail, userName, request);

  } catch (error) {
    console.error("Error creating custom store request:", error);
    throw error;
  }
}

// =====================================================
// Re-export all functionality
// =====================================================

// Request Operations
export {
  createAuthenticatedStoreRequest,
  getUserStoreRequests,
  getStoreRequest,
  cancelStoreRequest,
  getStoreRequests,
  updateStoreRequestStatus,
  getUserRequestStats,
  getStoreRequestStats
};

// User Context Operations
export {
  getUserStoreId,
  getUserStoreContext,
  validateUserStoreAccess,
  userBelongsToStore,
  getUserClubInfo
};

// Store Resolution Operations
export {
  getAvailableStores,
  getStoreById,
  validateStoreExists,
  getStoresByClub,
  searchStores,
  getStoreStats,
  isStoreAcceptingRequests
};

// Types
export type {
  BookAvailabilityRequest,
  CreateStoreRequestRequest,
  StoreRequestQueryOptions,
  UserRequestStats,
  StoreRequestStats,
  UserStoreContext,
  AvailableStore,
  StoreResponseStatus
};

// =====================================================
// Convenience Functions
// =====================================================

/**
 * Get user's complete store request overview
 */
export async function getUserStoreRequestOverview(userId: string): Promise<{
  storeContext: UserStoreContext | null;
  requests: BookAvailabilityRequest[];
  stats: UserRequestStats;
}> {
  try {
    const [storeContext, requests, stats] = await Promise.all([
      getUserStoreContext(userId),
      getUserStoreRequests(userId),
      getUserRequestStats(userId)
    ]);

    return {
      storeContext,
      requests,
      stats
    };

  } catch (error) {
    console.error("Error fetching user store request overview:", error);
    return {
      storeContext: null,
      requests: [],
      stats: {
        totalRequests: 0,
        pendingRequests: 0,
        availableBooks: 0,
        unavailableBooks: 0,
        orderedBooks: 0
      }
    };
  }
}

/**
 * Get store owner's complete request management overview
 */
export async function getStoreRequestManagementOverview(storeId: string): Promise<{
  storeDetails: any;
  requests: BookAvailabilityRequest[];
  stats: StoreRequestStats;
  storeStats: any;
}> {
  try {
    const [storeDetails, requests, stats, storeStats] = await Promise.all([
      getStoreById(storeId),
      getStoreRequests(storeId),
      getStoreRequestStats(storeId),
      getStoreStats(storeId)
    ]);

    return {
      storeDetails,
      requests,
      stats,
      storeStats
    };

  } catch (error) {
    console.error("Error fetching store request management overview:", error);
    return {
      storeDetails: null,
      requests: [],
      stats: {
        totalRequests: 0,
        authenticatedRequests: 0,
        anonymousRequests: 0,
        pendingRequests: 0,
        respondedRequests: 0
      },
      storeStats: null
    };
  }
}
