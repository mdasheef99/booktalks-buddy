/**
 * Request Operations Module
 * 
 * CRUD operations for store requests
 */

import { supabase, apiCall } from '@/lib/supabase';
import * as Sentry from "@sentry/react";
import { throwIfInvalid } from '@/lib/api/books/validation';
import { 
  BookAvailabilityRequest, 
  CreateStoreRequestRequest, 
  StoreRequestQueryOptions,
  UserRequestStats,
  StoreRequestStats,
  StoreResponseStatus
} from './types/storeRequests';
import { validateCreateStoreRequest, validateStoreRequestQuery, validateStoreResponseStatus, validateStoreResponse } from './requestValidation';
import { validateUserStoreAccess } from './userContextService';

// =====================================================
// User Request Operations
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

    // Validate input
    const validationResult = validateCreateStoreRequest(userId, userEmail, userName, request);
    throwIfInvalid(validationResult, 'createAuthenticatedStoreRequest');

    // Get user's store ID through club membership
    const userStoreId = await validateUserStoreAccess(userId);

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
        source: "requestOperations",
        action: "createAuthenticatedStoreRequest"
      },
      extra: { userId, request }
    });
    
    console.error("Error creating authenticated store request:", error);
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

    // Validate query options
    const validationResult = validateStoreRequestQuery(options);
    throwIfInvalid(validationResult, 'getUserStoreRequests');

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
        source: "requestOperations",
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
    console.error("Error cancelling store request:", error);
    return false;
  }
}

// =====================================================
// Store Owner Operations
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

    // Validate query options
    const validationResult = validateStoreRequestQuery(options);
    throwIfInvalid(validationResult, 'getStoreRequests');

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
  status: StoreResponseStatus,
  storeResponse?: string
): Promise<BookAvailabilityRequest | null> {
  try {
    console.log(`Updating store request ${requestId} status to ${status}`);

    // Validate inputs
    throwIfInvalid(validateStoreResponseStatus(status), 'status');
    throwIfInvalid(validateStoreResponse(storeResponse), 'storeResponse');

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
      console.log(`Successfully updated request status to ${status}`);
    }

    return result;

  } catch (error) {
    console.error("Error updating store request status:", error);
    throw error;
  }
}

// =====================================================
// Statistics Operations
// =====================================================

/**
 * Get store request statistics for user
 */
export async function getUserRequestStats(userId: string): Promise<UserRequestStats> {
  try {
    const requests = await getUserStoreRequests(userId);

    return {
      totalRequests: requests.length,
      pendingRequests: requests.filter(r => r.status === 'pending').length,
      respondedRequests: requests.filter(r => r.status === 'responded').length,
      resolvedRequests: requests.filter(r => r.status === 'resolved').length,
      // Legacy fields for backward compatibility (will be 0)
      availableBooks: 0,
      unavailableBooks: 0,
      orderedBooks: 0
    };

  } catch (error) {
    console.error("Error fetching user request stats:", error);
    return {
      totalRequests: 0,
      pendingRequests: 0,
      respondedRequests: 0,
      resolvedRequests: 0,
      availableBooks: 0,
      unavailableBooks: 0,
      orderedBooks: 0
    };
  }
}

/**
 * Get store request statistics for store owner
 */
export async function getStoreRequestStats(storeId: string): Promise<StoreRequestStats> {
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
    console.error("Error fetching store request stats:", error);
    return {
      totalRequests: 0,
      authenticatedRequests: 0,
      anonymousRequests: 0,
      pendingRequests: 0,
      respondedRequests: 0
    };
  }
}
