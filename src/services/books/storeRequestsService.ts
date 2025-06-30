/**
 * Store Requests Service
 * 
 * Extends existing book availability request system for authenticated users
 * Integrates with personal books library for seamless book requesting
 */

import { supabase, apiCall } from '@/lib/supabase';
import { PersonalBook } from './personalBooksService';
import { validateUserId, throwIfInvalid } from '@/lib/api/books/validation';
import * as Sentry from "@sentry/react";

// =====================================================
// Types
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
// Store Request Management (Authenticated Users)
// =====================================================

/**
 * Create book availability request for authenticated user
 */
export async function createAuthenticatedStoreRequest(
  userId: string,
  userEmail: string,
  userName: string,
  request: CreateStoreRequestRequest
): Promise<BookAvailabilityRequest | null> {
  try {
    console.log(`Creating store request for authenticated user ${userId}:`, request.book_title);

    // Get user's store ID through club membership
    const userStoreId = await getUserStoreId(userId);
    if (!userStoreId) {
      throw new Error('You must be a member of a book club to request books from stores');
    }

    const result = await apiCall<BookAvailabilityRequest>(
      supabase
        .from('book_availability_requests')
        .insert([{
          store_id: userStoreId,
          customer_name: userName,
          customer_email: userEmail,
          customer_phone: userEmail, // Use email as phone placeholder for authenticated users
          book_title: request.book_title,
          book_author: request.book_author,
          description: request.description,
          user_id: userId,
          google_books_id: request.google_books_id,
          request_source: 'authenticated_user',
          status: 'pending'
        }])
        .select(`
          *,
          stores (id, name)
        `)
        .single(),
      'Failed to submit book request'
    );

    if (result) {
      console.log(`Successfully created store request: ${result.book_title}`);
    }

    return result;
    
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        source: "storeRequestsService",
        action: "createAuthenticatedStoreRequest"
      },
      extra: { userId, request }
    });
    
    console.error("Error creating authenticated store request:", error);
    throw error;
  }
}

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
 * Get user's store requests
 */
export async function getUserStoreRequests(
  userId: string,
  options: StoreRequestQueryOptions = {}
): Promise<BookAvailabilityRequest[]> {
  try {
    console.log(`Fetching store requests for user ${userId}`, options);

    let query = supabase
      .from('book_availability_requests')
      .select(`
        *,
        stores (id, name)
      `)
      .eq('user_id', userId);

    // Apply status filter
    if (options.status) {
      query = query.eq('status', options.status);
    }

    // Apply store filter
    if (options.store_id) {
      query = query.eq('store_id', options.store_id);
    }

    // Apply sorting
    const sortBy = options.sortBy || 'created_at';
    const sortOrder = options.sortOrder || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    if (options.limit) {
      query = query.limit(options.limit);
    }
    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
    }

    const result = await apiCall<BookAvailabilityRequest[]>(
      query,
      'Failed to load your store requests'
    );

    console.log(`Loaded ${result?.length || 0} store requests`);
    return result || [];
    
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        source: "storeRequestsService",
        action: "getUserStoreRequests"
      },
      extra: { userId, options }
    });
    
    console.error("Error fetching user store requests:", error);
    return [];
  }
}

/**
 * Get store request by ID
 */
export async function getStoreRequest(
  userId: string,
  requestId: string
): Promise<BookAvailabilityRequest | null> {
  try {
    const result = await apiCall<BookAvailabilityRequest>(
      supabase
        .from('book_availability_requests')
        .select(`
          *,
          stores (id, name, email)
        `)
        .eq('user_id', userId)
        .eq('id', requestId)
        .single(),
      'Failed to load store request'
    );

    return result;
    
  } catch (error) {
    console.error("Error fetching store request:", error);
    return null;
  }
}

/**
 * Cancel store request (user can only cancel pending requests)
 */
export async function cancelStoreRequest(userId: string, requestId: string): Promise<boolean> {
  try {
    console.log(`Cancelling store request ${requestId} for user ${userId}`);

    // Only allow cancelling pending requests
    const result = await apiCall<any>(
      supabase
        .from('book_availability_requests')
        .delete()
        .eq('user_id', userId)
        .eq('id', requestId)
        .eq('status', 'pending'),
      'Failed to cancel store request'
    );

    if (result !== null) {
      console.log(`Successfully cancelled store request`);
    }

    return result !== null;
    
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        source: "storeRequestsService",
        action: "cancelStoreRequest"
      },
      extra: { userId, requestId }
    });
    
    console.error("Error cancelling store request:", error);
    return false;
  }
}

// =====================================================
// Store Owner Operations (Admin Panel Integration)
// =====================================================

/**
 * Get all store requests for store owner (both anonymous and authenticated)
 */
export async function getStoreRequests(
  storeId: string,
  options: StoreRequestQueryOptions = {}
): Promise<BookAvailabilityRequest[]> {
  try {
    console.log(`Fetching store requests for store ${storeId}`, options);

    let query = supabase
      .from('book_availability_requests')
      .select(`
        *,
        stores (id, name, email)
      `)
      .eq('store_id', storeId);

    // Apply request source filter
    if (options.request_source) {
      query = query.eq('request_source', options.request_source);
    }

    // Apply status filter
    if (options.status) {
      query = query.eq('status', options.status);
    }

    // Apply sorting (prioritize authenticated users, then by date)
    const sortBy = options.sortBy || 'created_at';
    const sortOrder = options.sortOrder || 'desc';

    if (sortBy === 'created_at') {
      // Custom sorting: authenticated users first, then by date
      query = query.order('request_source', { ascending: false }) // authenticated_user comes before anonymous
                   .order('created_at', { ascending: sortOrder === 'asc' });
    } else {
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });
    }

    // Apply pagination
    if (options.limit) {
      query = query.limit(options.limit);
    }
    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
    }

    const result = await apiCall<BookAvailabilityRequest[]>(
      query,
      'Failed to load store requests'
    );

    console.log(`Loaded ${result?.length || 0} store requests`);
    return result || [];
    
  } catch (error) {
    console.error("Error fetching store requests:", error);
    return [];
  }
}

/**
 * Update store request status (store owner only)
 */
export async function updateStoreRequestStatus(
  storeId: string,
  requestId: string,
  status: 'available' | 'unavailable' | 'ordered',
  storeResponse?: string
): Promise<BookAvailabilityRequest | null> {
  try {
    console.log(`Updating store request ${requestId} status to ${status}`);

    const updateData: any = {
      status,
      responded_at: new Date().toISOString()
    };

    if (storeResponse) {
      updateData.store_response = storeResponse.trim();
    }

    const result = await apiCall<BookAvailabilityRequest>(
      supabase
        .from('book_availability_requests')
        .update(updateData)
        .eq('store_id', storeId)
        .eq('id', requestId)
        .select(`
          *,
          stores (id, name, email)
        `)
        .single(),
      'Failed to update request status'
    );

    if (result) {
      console.log(`Successfully updated store request status`);
    }

    return result;
    
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        source: "storeRequestsService",
        action: "updateStoreRequestStatus"
      },
      extra: { storeId, requestId, status }
    });
    
    console.error("Error updating store request status:", error);
    throw error;
  }
}

// =====================================================
// Statistics and Analytics
// =====================================================

/**
 * Get store request statistics for user
 */
export async function getUserRequestStats(userId: string): Promise<{
  totalRequests: number;
  pendingRequests: number;
  availableBooks: number;
  unavailableBooks: number;
  orderedBooks: number;
}> {
  try {
    const requests = await getUserStoreRequests(userId);
    
    return {
      totalRequests: requests.length,
      pendingRequests: requests.filter(r => r.status === 'pending').length,
      availableBooks: requests.filter(r => r.status === 'available').length,
      unavailableBooks: requests.filter(r => r.status === 'unavailable').length,
      orderedBooks: requests.filter(r => r.status === 'ordered').length
    };
    
  } catch (error) {
    console.error("Error getting user request stats:", error);
    return {
      totalRequests: 0,
      pendingRequests: 0,
      availableBooks: 0,
      unavailableBooks: 0,
      orderedBooks: 0
    };
  }
}

/**
 * Get store request statistics for store owner
 */
export async function getStoreRequestStats(storeId: string): Promise<{
  totalRequests: number;
  authenticatedRequests: number;
  anonymousRequests: number;
  pendingRequests: number;
  respondedRequests: number;
}> {
  try {
    const requests = await getStoreRequests(storeId);
    
    return {
      totalRequests: requests.length,
      authenticatedRequests: requests.filter(r => r.request_source === 'authenticated_user').length,
      anonymousRequests: requests.filter(r => r.request_source === 'anonymous').length,
      pendingRequests: requests.filter(r => r.status === 'pending').length,
      respondedRequests: requests.filter(r => r.status !== 'pending').length
    };
    
  } catch (error) {
    console.error("Error getting store request stats:", error);
    return {
      totalRequests: 0,
      authenticatedRequests: 0,
      anonymousRequests: 0,
      pendingRequests: 0,
      respondedRequests: 0
    };
  }
}

// =====================================================
// User Store Context
// =====================================================

/**
 * Get user's store ID through club membership
 * Users belong to stores via their club memberships
 */
export async function getUserStoreId(userId: string): Promise<string | null> {
  try {
    throwIfInvalid(validateUserId(userId), 'userId');

    const { data, error } = await supabase
      .from('club_members')
      .select('book_clubs!inner(store_id)')
      .eq('user_id', userId)
      .limit(1)
      .single();

    if (error || !data) {
      console.warn(`Could not find store context for user ${userId}:`, error);
      return null;
    }

    return data.book_clubs?.store_id || null;
  } catch (error) {
    console.error('Error getting user store ID:', error);
    return null;
  }
}

/**
 * Get user's store context including store details
 */
export async function getUserStoreContext(userId: string): Promise<{
  store_id: string;
  store_name: string;
} | null> {
  try {
    throwIfInvalid(validateUserId(userId), 'userId');

    const { data, error } = await supabase
      .from('club_members')
      .select(`
        book_clubs!inner(
          store_id,
          stores!inner(
            id,
            name
          )
        )
      `)
      .eq('user_id', userId)
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      store_id: data.book_clubs.store_id,
      store_name: data.book_clubs.stores.name
    };
  } catch (error) {
    console.error('Error getting user store context:', error);
    return null;
  }
}

// =====================================================
// Available Stores
// =====================================================

/**
 * Get available stores for book requests
 */
export async function getAvailableStores(): Promise<Array<{
  id: string;
  name: string;
}>> {
  try {
    const result = await apiCall<Array<{
      id: string;
      name: string;
    }>>(
      supabase
        .from('stores')
        .select('id, name')
        .order('name'),
      'Failed to load available stores'
    );

    return result || [];
    
  } catch (error) {
    console.error("Error fetching available stores:", error);
    return [];
  }
}
