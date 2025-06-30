/**
 * Collections Service
 * 
 * Handles user-created book collections and lists
 * Provides collection management and book organization
 */

import { supabase, apiCall } from '@/lib/supabase';
import { PersonalBook } from './personalBooksService';
import * as Sentry from "@sentry/react";
import {
  validateUserId,
  validatePersonalBookId,
  validateCollectionId,
  validateCollectionName,
  validateCollectionDescription,
  validateCollectionNotes,
  validatePrivacySetting,
  throwIfInvalid,
  validateMultiple
} from '@/lib/api/books/validation';

// =====================================================
// Types
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
// Collection Management
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
    const validationResult = validateMultiple([
      { result: validateUserId(userId), field: 'userId' },
      { result: validateCollectionName(request.name), field: 'name' },
      { result: validateCollectionDescription(request.description), field: 'description' },
      { result: validatePrivacySetting(request.is_public), field: 'is_public' }
    ]);

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
        source: "collectionsService",
        action: "createCollection"
      },
      extra: { userId, request }
    });
    
    console.error("Error creating collection:", error);
    throw error;
  }
}

/**
 * Get user's collections
 */
export async function getUserCollections(
  userId: string,
  options: CollectionQueryOptions = {}
): Promise<BookCollection[]> {
  try {
    // Input validation
    throwIfInvalid(validateUserId(userId), 'userId');

    console.log(`Fetching collections for user ${userId}`, options);

    let query = supabase
      .from('book_collections')
      .select('*')
      .eq('user_id', userId);

    // Apply privacy filter
    if (!options.includePrivate) {
      query = query.eq('is_public', true);
    }

    // Apply sorting
    const sortBy = options.sortBy || 'updated_at';
    const sortOrder = options.sortOrder || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    if (options.limit) {
      query = query.limit(options.limit);
    }
    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
    }

    const result = await apiCall<BookCollection[]>(
      query,
      'Failed to load collections'
    );

    let collections = result || [];

    // Add computed fields if requested
    if (options.includeBookCount || options.includePreviewCovers) {
      collections = await Promise.all(
        collections.map(async (collection) => {
          const enriched = { ...collection };
          
          if (options.includeBookCount) {
            enriched.book_count = await getCollectionBookCount(collection.id);
          }
          
          if (options.includePreviewCovers) {
            enriched.preview_covers = await getCollectionPreviewCovers(collection.id, 4);
          }
          
          return enriched;
        })
      );
    }

    console.log(`Loaded ${collections.length} collections`);
    return collections;
    
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        source: "collectionsService",
        action: "getUserCollections"
      },
      extra: { userId, options }
    });
    
    console.error("Error fetching collections:", error);
    return [];
  }
}

/**
 * Get public collections for profile viewing
 */
export async function getPublicCollections(
  userId: string,
  options: CollectionQueryOptions = {}
): Promise<BookCollection[]> {
  return getUserCollections(userId, { ...options, includePrivate: false });
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
    throwIfInvalid(validateUserId(userId), 'userId');
    throwIfInvalid(validateCollectionId(collectionId), 'collectionId');

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
    throwIfInvalid(validateUserId(userId), 'userId');
    throwIfInvalid(validateCollectionId(collectionId), 'collectionId');

    // Validate update fields if provided
    if (updates.name !== undefined) {
      throwIfInvalid(validateCollectionName(updates.name), 'name');
      updates.name = updates.name.trim();
    }
    if (updates.description !== undefined) {
      throwIfInvalid(validateCollectionDescription(updates.description), 'description');
      updates.description = updates.description?.trim();
    }
    if (updates.is_public !== undefined) {
      throwIfInvalid(validatePrivacySetting(updates.is_public), 'is_public');
    }

    console.log(`Updating collection ${collectionId} for user ${userId}:`, updates);

    const result = await apiCall<BookCollection>(
      supabase
        .from('book_collections')
        .update(updates)
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
        source: "collectionsService",
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
export async function deleteCollection(userId: string, collectionId: string): Promise<boolean> {
  try {
    // Input validation
    throwIfInvalid(validateUserId(userId), 'userId');
    throwIfInvalid(validateCollectionId(collectionId), 'collectionId');

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
        source: "collectionsService",
        action: "deleteCollection"
      },
      extra: { userId, collectionId }
    });
    
    console.error("Error deleting collection:", error);
    return false;
  }
}

// =====================================================
// Collection Books Management
// =====================================================

/**
 * Add book to collection
 */
export async function addBookToCollection(
  userId: string,
  collectionId: string,
  request: AddBookToCollectionRequest
): Promise<CollectionBook | null> {
  try {
    // Input validation
    const validationResult = validateMultiple([
      { result: validateUserId(userId), field: 'userId' },
      { result: validateCollectionId(collectionId), field: 'collectionId' },
      { result: validatePersonalBookId(request.book_id), field: 'book_id' },
      { result: validateCollectionNotes(request.notes), field: 'notes' }
    ]);

    throwIfInvalid(validationResult, 'addBookToCollection');

    console.log(`Adding book to collection ${collectionId} for user ${userId}`);

    // Verify collection ownership
    const collection = await getCollection(userId, collectionId);
    if (!collection) {
      throw new Error('Collection not found or access denied');
    }

    const result = await apiCall<CollectionBook>(
      supabase
        .from('collection_books')
        .insert([{
          collection_id: collectionId,
          book_id: request.book_id,
          notes: request.notes?.trim()
        }])
        .select(`
          *,
          personal_books (*)
        `)
        .single(),
      'Failed to add book to collection'
    );

    if (result) {
      console.log(`Successfully added book to collection`);
      
      // Update collection's updated_at timestamp
      await supabase
        .from('book_collections')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', collectionId);
    }

    return result;
    
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        source: "collectionsService",
        action: "addBookToCollection"
      },
      extra: { userId, collectionId, request }
    });
    
    console.error("Error adding book to collection:", error);
    throw error;
  }
}

/**
 * Get books in collection
 */
export async function getCollectionBooks(
  userId: string,
  collectionId: string,
  limit?: number,
  offset?: number
): Promise<CollectionBook[]> {
  try {
    console.log(`Fetching books for collection ${collectionId}`);

    // Verify collection access
    const collection = await getCollection(userId, collectionId);
    if (!collection) {
      throw new Error('Collection not found or access denied');
    }

    let query = supabase
      .from('collection_books')
      .select(`
        *,
        personal_books (*)
      `)
      .eq('collection_id', collectionId)
      .order('added_at', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }
    if (offset) {
      query = query.range(offset, offset + (limit || 50) - 1);
    }

    const result = await apiCall<CollectionBook[]>(
      query,
      'Failed to load collection books'
    );

    console.log(`Loaded ${result?.length || 0} books from collection`);
    return result || [];
    
  } catch (error) {
    console.error("Error fetching collection books:", error);
    return [];
  }
}

/**
 * Remove book from collection
 */
export async function removeBookFromCollection(
  userId: string,
  collectionId: string,
  bookId: string
): Promise<boolean> {
  try {
    console.log(`Removing book ${bookId} from collection ${collectionId}`);

    // Verify collection ownership
    const collection = await getCollection(userId, collectionId);
    if (!collection) {
      throw new Error('Collection not found or access denied');
    }

    const result = await apiCall<any>(
      supabase
        .from('collection_books')
        .delete()
        .eq('collection_id', collectionId)
        .eq('book_id', bookId),
      'Failed to remove book from collection'
    );

    if (result !== null) {
      console.log(`Successfully removed book from collection`);
      
      // Update collection's updated_at timestamp
      await supabase
        .from('book_collections')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', collectionId);
    }

    return result !== null;
    
  } catch (error) {
    console.error("Error removing book from collection:", error);
    return false;
  }
}

/**
 * Update book notes in collection
 */
export async function updateBookInCollection(
  userId: string,
  collectionId: string,
  bookId: string,
  notes: string
): Promise<CollectionBook | null> {
  try {
    // Verify collection ownership
    const collection = await getCollection(userId, collectionId);
    if (!collection) {
      throw new Error('Collection not found or access denied');
    }

    const result = await apiCall<CollectionBook>(
      supabase
        .from('collection_books')
        .update({ notes: notes.trim() })
        .eq('collection_id', collectionId)
        .eq('book_id', bookId)
        .select(`
          *,
          personal_books (*)
        `)
        .single(),
      'Failed to update book notes'
    );

    return result;
    
  } catch (error) {
    console.error("Error updating book in collection:", error);
    return null;
  }
}

// =====================================================
// Helper Functions
// =====================================================

/**
 * Get collection book count
 */
async function getCollectionBookCount(collectionId: string): Promise<number> {
  try {
    const { count } = await supabase
      .from('collection_books')
      .select('*', { count: 'exact', head: true })
      .eq('collection_id', collectionId);

    return count || 0;
    
  } catch (error) {
    console.error("Error getting collection book count:", error);
    return 0;
  }
}

/**
 * Get preview covers for collection
 */
async function getCollectionPreviewCovers(
  collectionId: string, 
  limit: number = 4
): Promise<string[]> {
  try {
    const { data } = await supabase
      .from('collection_books')
      .select(`
        personal_books (cover_url)
      `)
      .eq('collection_id', collectionId)
      .not('personal_books.cover_url', 'is', null)
      .limit(limit);

    if (!data) return [];

    return data
      .map(item => item.personal_books?.cover_url)
      .filter(Boolean) as string[];
    
  } catch (error) {
    console.error("Error getting collection preview covers:", error);
    return [];
  }
}

/**
 * Check if book is in collection
 */
export async function isBookInCollection(
  collectionId: string,
  bookId: string
): Promise<boolean> {
  try {
    const result = await apiCall<CollectionBook>(
      supabase
        .from('collection_books')
        .select('id')
        .eq('collection_id', collectionId)
        .eq('book_id', bookId)
        .single(),
      'Failed to check book in collection'
    );

    return result !== null;
    
  } catch (error) {
    return false;
  }
}
