/**
 * useCollectionBooks Hook
 * 
 * Book-to-collection relationship management with optimistic updates
 * Handles adding, removing, and updating books within a specific collection
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  getCollectionBooks,
  addBookToCollection as addBookToCollectionService,
  removeBookFromCollection as removeBookFromCollectionService,
  updateBookInCollection,
  CollectionBook
} from '@/services/books/collections';
import { UseCollectionBooksReturn, CollectionHookOptions } from './types';

export function useCollectionBooks(
  collectionId: string,
  options: CollectionHookOptions = {}
): UseCollectionBooksReturn {
  const {
    enabled = true,
    refetchOnWindowFocus = false
  } = options;

  // State management
  const [books, setBooks] = useState<CollectionBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch books in collection
  const fetchBooks = useCallback(async () => {
    if (!enabled || !collectionId) return;

    try {
      setLoading(true);
      setError(null);
      
      const data = await getCollectionBooks(collectionId, {
        sortBy: 'added_at',
        sortOrder: 'desc'
      });
      
      setBooks(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load collection books';
      setError(errorMessage);
      console.error('Error fetching collection books:', err);
    } finally {
      setLoading(false);
    }
  }, [collectionId, enabled]);

  // Refresh books (public method)
  const refreshBooks = useCallback(async () => {
    await fetchBooks();
  }, [fetchBooks]);

  // Add book to collection
  const addBook = useCallback(async (bookId: string, notes?: string): Promise<void> => {
    try {
      await addBookToCollectionService(collectionId, bookId);
      
      // Refresh to get the complete book data
      await fetchBooks();
      
      toast.success('Book added to collection');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add book to collection';
      toast.error(errorMessage);
      throw err;
    }
  }, [collectionId, fetchBooks]);

  // Remove book from collection
  const removeBook = useCallback(async (bookId: string): Promise<void> => {
    try {
      // Optimistically update local state
      setBooks(prev => prev.filter(book => book.personal_books?.id !== bookId));
      
      await removeBookFromCollectionService(collectionId, bookId);
      
      toast.success('Book removed from collection');
    } catch (err) {
      // Revert optimistic update on error
      await fetchBooks();
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove book from collection';
      toast.error(errorMessage);
      throw err;
    }
  }, [collectionId, fetchBooks]);

  // Update book notes in collection
  const updateBookNotes = useCallback(async (bookId: string, notes: string): Promise<void> => {
    try {
      // Optimistically update local state
      setBooks(prev => prev.map(book => 
        book.personal_books?.id === bookId 
          ? { ...book, notes } 
          : book
      ));
      
      await updateBookInCollection(collectionId, bookId, { notes });
      
      toast.success('Notes updated');
    } catch (err) {
      // Revert optimistic update on error
      await fetchBooks();
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to update notes';
      toast.error(errorMessage);
      throw err;
    }
  }, [collectionId, fetchBooks]);

  // Check if book is in collection
  const isBookInCollection = useCallback((bookId: string): boolean => {
    return books.some(book => book.personal_books?.id === bookId);
  }, [books]);

  // Initial load
  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  // Handle window focus refetch
  useEffect(() => {
    if (!refetchOnWindowFocus) return;

    const handleFocus = () => {
      if (!document.hidden) {
        fetchBooks();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [fetchBooks, refetchOnWindowFocus]);

  return {
    books,
    loading,
    error,
    refreshBooks,
    addBook,
    removeBook,
    updateBookNotes,
    isBookInCollection
  };
}
