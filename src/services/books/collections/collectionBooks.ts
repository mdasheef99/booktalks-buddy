/**
 * Collection Books Management Module
 * 
 * Handles book-to-collection relationship management
 */

import { supabase, apiCall } from '@/lib/supabase';
import { PersonalBook } from '../personalBooksService';
import * as Sentry from "@sentry/react";
import { throwIfInvalid } from '@/lib/api/books/validation';
import {
  validateAddBookToCollectionRequest,
  validateCollectionAccess
} from './collectionValidation';
import { getCollection } from './collectionCrud';
import {
  CollectionBook,
  AddBookToCollectionRequest
} from './types/collections';

// =====================================================
// Book-Collection Relationship Management
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
    const validationResult = validateAddBookToCollectionRequest(userId, collectionId, request);
    throwIfInvalid(validationResult, 'addBookToCollection');

    // Verify collection access
    const collection = await getCollection(userId, collectionId);
    if (!collection) {
      throw new Error('Collection not found or access denied');
    }

    console.log(`Adding book ${request.book_id} to collection ${collectionId}`);

    // Check if book is already in collection (don't use .single() since there might be 0 rows)
    const { data: existingEntries, error: checkError } = await supabase
      .from('collection_books')
      .select('id')
      .eq('collection_id', collectionId)
      .eq('book_id', request.book_id)
      .limit(1);

    if (checkError) {
      console.error('Error checking for existing book in collection:', checkError);
      throw new Error('Failed to check if book is already in collection');
    }

    if (existingEntries && existingEntries.length > 0) {
      throw new Error('Book is already in this collection');
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
    }

    return result;
    
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        source: "collectionBooks",
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
    // Input validation
    const validationResult = validateCollectionAccess(userId, collectionId);
    throwIfInvalid(validationResult, 'removeBookFromCollection');

    // Verify collection access
    const collection = await getCollection(userId, collectionId);
    if (!collection) {
      throw new Error('Collection not found or access denied');
    }

    console.log(`Removing book ${bookId} from collection ${collectionId}`);

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
    }

    return result !== null;
    
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        source: "collectionBooks",
        action: "removeBookFromCollection"
      },
      extra: { userId, collectionId, bookId }
    });
    
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
  notes?: string
): Promise<CollectionBook | null> {
  try {
    // Input validation
    const validationResult = validateCollectionAccess(userId, collectionId);
    throwIfInvalid(validationResult, 'updateBookInCollection');

    // Verify collection access
    const collection = await getCollection(userId, collectionId);
    if (!collection) {
      throw new Error('Collection not found or access denied');
    }

    console.log(`Updating book ${bookId} notes in collection ${collectionId}`);

    const result = await apiCall<CollectionBook>(
      supabase
        .from('collection_books')
        .update({ notes: notes?.trim() })
        .eq('collection_id', collectionId)
        .eq('book_id', bookId)
        .select(`
          *,
          personal_books (*)
        `)
        .single(),
      'Failed to update book in collection'
    );

    if (result) {
      console.log(`Successfully updated book notes in collection`);
    }

    return result;
    
  } catch (error) {
    console.error("Error updating book in collection:", error);
    throw error;
  }
}

/**
 * Check if book is in collection
 */
export async function isBookInCollection(
  userId: string,
  collectionId: string,
  bookId: string
): Promise<boolean> {
  try {
    // First verify the collection exists and user has access
    const { data: collection, error: collectionError } = await supabase
      .from('book_collections')
      .select('id')
      .eq('user_id', userId)
      .eq('id', collectionId)
      .single();

    if (collectionError || !collection) {
      return false;
    }

    // Check if book is in collection (don't use .single() since there might be 0 rows)
    const { data: result, error } = await supabase
      .from('collection_books')
      .select('id')
      .eq('collection_id', collectionId)
      .eq('book_id', bookId)
      .limit(1);

    if (error) {
      console.error('Error checking if book is in collection:', error);
      return false;
    }

    return Boolean(result && result.length > 0);

  } catch (error) {
    console.error("Error checking if book is in collection:", error);
    return false;
  }
}
