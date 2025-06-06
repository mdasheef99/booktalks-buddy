import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Hook to get the current store ID
 * In single-tenant deployments, this returns the first (and typically only) store
 * In multi-tenant deployments, this could be enhanced to determine store by domain/context
 */
export const useStoreId = () => {
  const [storeId, setStoreId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStoreId = async () => {
      try {
        setLoading(true);
        setError(null);

        // For single-tenant setup, get the first store
        const { data: storeData, error: storeError } = await supabase
          .from('stores')
          .select('id')
          .limit(1)
          .single();

        if (storeError) {
          console.error('Error fetching store:', storeError);
          setError('Failed to load store information');
          setStoreId(null);
        } else if (storeData) {
          setStoreId(storeData.id);
        } else {
          console.warn('No store found in the database');
          setError('No store found');
          setStoreId(null);
        }
      } catch (err) {
        console.error('Error in fetchStoreId:', err);
        setError('Failed to load store information');
        setStoreId(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStoreId();
  }, []);

  return {
    storeId,
    loading,
    error,
    // Helper methods for better UX
    isReady: !loading && !error && !!storeId,
    hasError: !!error
  };
};
