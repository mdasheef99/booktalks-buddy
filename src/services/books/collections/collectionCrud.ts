/**
 * Collection CRUD Operations Module
 * 
 * Handles create, read, update, delete operations for collections
 */

import { supabase, apiCall } from '@/lib/supabase';
import * as Sentry from "@sentry/react";
import { throwIfInvalid } from '@/lib/api/books/validation';
import {
  validateCreateCollectionRequest,
  validateUpdateCollectionRequest,
  validateCollectionAccess
} from './collectionValidation';
import {
  BookCollection,
  CreateCollectionRequest,
  UpdateCollectionRequest
} from './types/collections';

// =====================================================
// CRUD Operations
// =====================================================

/**
 * Create a new book collection
 */
export async function createCollection(
  userId: string,
  request: CreateCollectionRequest
): Promise<BookCollection | null> {
  try {
    // Input validation
    const validationResult = validateCreateCollectionRequest(userId, request);
    throwIfInvalid(validationResult, 'createCollection');

    console.log(`Creating collection for user ${userId}:`, request.name);

    const result = await apiCall<BookCollection>(
      supabase
        .from('book_collections')
        .insert([{
          user_id: userId,
          name: request.name.trim(),
          description: request.description?.trim(),
          is_public: request.is_public ?? true
        }])
        .select()
        .single(),
      'Failed to create collection'
    );

    if (result) {
      console.log(`Successfully created collection: ${result.name}`);
    }

    return result;
    
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        source: "collectionCrud",
        action: "createCollection"
      },
      extra: { userId, request }
    });
    
    console.error("Error creating collection:", error);
    throw error;
  }
}

/**
 * Get collection by ID
 */
export async function getCollection(
  userId: string,
  collectionId: string
): Promise<BookCollection | null> {
  try {
    // Input validation
    const validationResult = validateCollectionAccess(userId, collectionId);
    throwIfInvalid(validationResult, 'getCollection');

    const result = await apiCall<BookCollection>(
      supabase
        .from('book_collections')
        .select('*')
        .eq('user_id', userId)
        .eq('id', collectionId)
        .single(),
      'Failed to load collection'
    );

    return result;
    
  } catch (error) {
    console.error("Error fetching collection:", error);
    return null;
  }
}

/**
 * Update collection
 */
export async function updateCollection(
  userId: string,
  collectionId: string,
  updates: UpdateCollectionRequest
): Promise<BookCollection | null> {
  try {
    // Input validation
    const validationResult = validateUpdateCollectionRequest(userId, collectionId, updates);
    throwIfInvalid(validationResult, 'updateCollection');

    // Prepare update data
    const updateData: any = {};
    
    if (updates.name !== undefined) {
      updateData.name = updates.name.trim();
    }
    if (updates.description !== undefined) {
      updateData.description = updates.description?.trim();
    }
    if (updates.is_public !== undefined) {
      updateData.is_public = updates.is_public;
    }

    console.log(`Updating collection ${collectionId} for user ${userId}:`, updateData);

    const result = await apiCall<BookCollection>(
      supabase
        .from('book_collections')
        .update(updateData)
        .eq('user_id', userId)
        .eq('id', collectionId)
        .select()
        .single(),
      'Failed to update collection'
    );

    if (result) {
      console.log(`Successfully updated collection: ${result.name}`);
    }

    return result;
    
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        source: "collectionCrud",
        action: "updateCollection"
      },
      extra: { userId, collectionId, updates }
    });
    
    console.error("Error updating collection:", error);
    throw error;
  }
}

/**
 * Delete collection
 */
export async function deleteCollection(
  userId: string,
  collectionId: string
): Promise<boolean> {
  try {
    // Input validation
    const validationResult = validateCollectionAccess(userId, collectionId);
    throwIfInvalid(validationResult, 'deleteCollection');

    console.log(`Deleting collection ${collectionId} for user ${userId}`);

    const result = await apiCall<any>(
      supabase
        .from('book_collections')
        .delete()
        .eq('user_id', userId)
        .eq('id', collectionId),
      'Failed to delete collection'
    );

    if (result !== null) {
      console.log(`Successfully deleted collection`);
    }

    return result !== null;
    
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        source: "collectionCrud",
        action: "deleteCollection"
      },
      extra: { userId, collectionId }
    });
    
    console.error("Error deleting collection:", error);
    return false;
  }
}
