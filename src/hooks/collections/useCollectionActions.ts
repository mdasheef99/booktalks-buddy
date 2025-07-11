/**
 * useCollectionActions Hook
 * 
 * Collection action handlers for create, edit, delete operations
 * Provides loading states and error handling for collection actions
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
  createCollection as createCollectionService,
  updateCollection as updateCollectionService,
  deleteCollection as deleteCollectionService,
  addBookToCollection as addBookToCollectionService,
  removeBookFromCollection as removeBookFromCollectionService,
  BookCollection,
  CreateCollectionRequest,
  UpdateCollectionRequest
} from '@/services/books/collections';
import { UseCollectionActionsReturn } from './types';

export function useCollectionActions(): UseCollectionActionsReturn {
  // Loading states for different actions
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Create collection
  const createCollection = useCallback(async (
    userId: string, 
    data: CreateCollectionRequest
  ): Promise<BookCollection> => {
    setIsCreating(true);
    try {
      const newCollection = await createCollectionService(userId, data);
      toast.success('Collection created successfully!');
      return newCollection;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create collection';
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsCreating(false);
    }
  }, []);

  // Update collection
  const updateCollection = useCallback(async (
    collectionId: string, 
    data: UpdateCollectionRequest
  ): Promise<BookCollection> => {
    setIsUpdating(true);
    try {
      const updatedCollection = await updateCollectionService(collectionId, data);
      toast.success('Collection updated successfully!');
      return updatedCollection;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update collection';
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, []);

  // Delete collection
  const deleteCollection = useCallback(async (collectionId: string): Promise<void> => {
    setIsDeleting(true);
    try {
      await deleteCollectionService(collectionId);
      toast.success('Collection deleted successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete collection';
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsDeleting(false);
    }
  }, []);

  // Add book to collection
  const addBookToCollection = useCallback(async (
    collectionId: string, 
    bookId: string, 
    notes?: string
  ): Promise<void> => {
    try {
      await addBookToCollectionService(collectionId, bookId);
      toast.success('Book added to collection!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add book to collection';
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  // Remove book from collection
  const removeBookFromCollection = useCallback(async (
    collectionId: string, 
    bookId: string
  ): Promise<void> => {
    try {
      await removeBookFromCollectionService(collectionId, bookId);
      toast.success('Book removed from collection!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove book from collection';
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  return {
    isCreating,
    isUpdating,
    isDeleting,
    createCollection,
    updateCollection,
    deleteCollection,
    addBookToCollection,
    removeBookFromCollection
  };
}
