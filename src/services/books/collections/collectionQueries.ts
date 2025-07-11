/**
 * Collection Queries Module
 * 
 * Handles complex database queries and joins for collections
 */

import { supabase, apiCall } from '@/lib/supabase';
import { getCollectionBookCount, getCollectionPreviewCovers } from './collectionStats';
import { throwIfInvalid, validateUserId } from '@/lib/api/books/validation';
import { validateCollectionQueryOptions } from './collectionValidation';
import * as Sentry from "@sentry/react";
import {
  BookCollection,
  CollectionQueryOptions
} from './types/collections';

// =====================================================
// Query Functions
// =====================================================

/**
 * Get user's collections with advanced options
 */
export async function getUserCollections(
  userId: string,
  options: CollectionQueryOptions = {}
): Promise<BookCollection[]> {
  try {
    // Input validation
    throwIfInvalid(validateUserId(userId), 'userId');
    throwIfInvalid(validateCollectionQueryOptions(options), 'options');

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
        source: "collectionQueries",
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
 * Search collections by name or description
 */
export async function searchUserCollections(
  userId: string,
  searchTerm: string,
  options: CollectionQueryOptions = {}
): Promise<BookCollection[]> {
  try {
    // Input validation
    throwIfInvalid(validateUserId(userId), 'userId');

    if (!searchTerm || searchTerm.trim().length === 0) {
      return getUserCollections(userId, options);
    }

    console.log(`Searching collections for user ${userId} with term: ${searchTerm}`);

    const searchLower = searchTerm.toLowerCase().trim();

    let query = supabase
      .from('book_collections')
      .select('*')
      .eq('user_id', userId)
      .or(`name.ilike.%${searchLower}%,description.ilike.%${searchLower}%`);

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
      'Failed to search collections'
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

    console.log(`Found ${collections.length} collections matching search`);
    return collections;
    
  } catch (error) {
    console.error("Error searching collections:", error);
    return [];
  }
}

/**
 * Get collections containing a specific book
 */
export async function getCollectionsContainingBook(
  userId: string,
  bookId: string
): Promise<BookCollection[]> {
  try {
    // Input validation
    throwIfInvalid(validateUserId(userId), 'userId');

    console.log(`Finding collections containing book ${bookId} for user ${userId}`);

    const { data, error } = await supabase
      .from('collection_books')
      .select(`
        collection_id,
        book_collections!inner (*)
      `)
      .eq('book_id', bookId)
      .eq('book_collections.user_id', userId);

    if (error) {
      console.error("Error finding collections containing book:", error);
      return [];
    }

    if (!data) return [];

    // Extract collections from the joined data
    const collections = data.map(item => item.book_collections).filter(Boolean);

    console.log(`Found ${collections.length} collections containing the book`);
    return collections;
    
  } catch (error) {
    console.error("Error finding collections containing book:", error);
    return [];
  }
}
