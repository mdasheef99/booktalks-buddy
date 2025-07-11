/**
 * useBookListings Hook
 * 
 * Custom hook for managing book listings data and filtering.
 */

import { useState, useEffect, useMemo } from 'react';
import { BookListingService } from '@/lib/services/bookListingService';
import { BookListingData, BookListingStatus } from '@/types/bookListings';
import { filterListings } from '../utils/listingUtils';
import type { UseBookListingsReturn, TabValue } from '../types';

interface UseBookListingsProps {
  storeId: string | null;
  activeTab: TabValue;
  searchTerm: string;
  storeAccessLoading: boolean;
}

export const useBookListings = ({
  storeId,
  activeTab,
  searchTerm,
  storeAccessLoading
}: UseBookListingsProps): UseBookListingsReturn => {
  const [listings, setListings] = useState<BookListingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load listings from API - Always load ALL listings for accurate tab counts
  const loadListings = async () => {
    if (!storeId) return;

    try {
      setLoading(true);
      setError(null);

      // Load ALL listings without status filter to enable accurate tab counts
      const data = await BookListingService.getStoreBookListings(storeId);
      setListings(data);
    } catch (err) {
      console.error('Error loading book listings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load book listings');
    } finally {
      setLoading(false);
    }
  };

  // Load listings when dependencies change - removed activeTab dependency since we load all listings
  useEffect(() => {
    if (storeId && !storeAccessLoading) {
      loadListings();
    }
  }, [storeId, storeAccessLoading]);

  // Filter listings based on active tab and search term
  const filteredListings = useMemo(() => {
    return filterListings(listings, activeTab, searchTerm);
  }, [listings, activeTab, searchTerm]);

  return {
    listings,
    loading,
    error,
    loadListings,
    filteredListings
  };
};
