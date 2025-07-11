/**
 * useCollections Hook
 * 
 * Collection CRUD operations and state management
 * Provides comprehensive collection management functionality
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  getUserCollections,
  createCollection as createCollectionService,
  updateCollection as updateCollectionService,
  deleteCollection as deleteCollectionService,
  BookCollection,
  CreateCollectionRequest,
  UpdateCollectionRequest
} from '@/services/books/collections';
import { UseCollectionsReturn, CollectionHookOptions } from './types';

export function useCollections(
  userId: string,
  options: CollectionHookOptions = {}
): UseCollectionsReturn {
  const {
    enabled = true,
    refetchOnWindowFocus = false,
    refetchInterval
  } = options;

  // State management
  const [collections, setCollections] = useState<BookCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch collections from server
  const fetchCollections = useCallback(async () => {
    if (!enabled || !userId) return;

    try {
      setLoading(true);
      setError(null);
      
      const data = await getUserCollections(userId, {
        includeBookCount: true,
        includePreviewCovers: true,
        sortBy: 'updated_at',
        sortOrder: 'desc'
      });
      
      setCollections(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load collections';
      setError(errorMessage);
      console.error('Error fetching collections:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, enabled]);

  // Refresh collections (public method)
  const refreshCollections = useCallback(async () => {
    await fetchCollections();
  }, [fetchCollections]);

  // Create new collection
  const createCollection = useCallback(async (data: CreateCollectionRequest): Promise<BookCollection> => {
    try {
      const newCollection = await createCollectionService(userId, data);
      
      // Optimistically update local state
      setCollections(prev => [newCollection, ...prev]);
      
      return newCollection;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create collection';
      toast.error(errorMessage);
      throw err;
    }
  }, [userId]);

  // Update existing collection
  const updateCollection = useCallback(async (
    collectionId: string,
    data: UpdateCollectionRequest
  ): Promise<BookCollection> => {
    try {
      const updatedCollection = await updateCollectionService(userId, collectionId, data);
      
      // Optimistically update local state
      setCollections(prev => prev.map(collection => 
        collection.id === collectionId ? updatedCollection : collection
      ));
      
      return updatedCollection;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update collection';
      toast.error(errorMessage);
      throw err;
    }
  }, [userId]);

  // Delete collection
  const deleteCollection = useCallback(async (collectionId: string): Promise<void> => {
    try {
      await deleteCollectionService(userId, collectionId);

      // Optimistically update local state
      setCollections(prev => prev.filter(collection => collection.id !== collectionId));
      
      toast.success('Collection deleted successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete collection';
      toast.error(errorMessage);
      throw err;
    }
  }, [userId]);

  // Initial load and setup
  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  // Handle window focus refetch
  useEffect(() => {
    if (!refetchOnWindowFocus) return;

    const handleFocus = () => {
      if (!document.hidden) {
        fetchCollections();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [fetchCollections, refetchOnWindowFocus]);

  // Handle refetch interval
  useEffect(() => {
    if (!refetchInterval) return;

    const interval = setInterval(fetchCollections, refetchInterval);
    return () => clearInterval(interval);
  }, [fetchCollections, refetchInterval]);

  return {
    collections,
    loading,
    error,
    refreshCollections,
    createCollection,
    updateCollection,
    deleteCollection
  };
}
