/**
 * Member Search Hook
 * Custom hook for searching and managing store members
 */

import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CommunityShowcaseAPI } from '@/lib/api/store/communityShowcase';
import type { StoreUser } from '@/lib/api/store/types/communityShowcaseTypes';
import type { UseMemberSearchResult } from '../types/memberSpotlightTypes';
import { SPOTLIGHT_QUERY_KEYS, SEARCH_CONFIG } from '../constants/memberSpotlightConstants';
import { isValidSearchTerm, validateSearchTerm } from '../utils/memberSpotlightValidation';
import { filterMembersBySearch } from '../utils/memberSpotlightUtils';

/**
 * Custom hook for member search functionality
 */
export const useMemberSearch = (storeId: string): UseMemberSearchResult => {
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch members based on search term
  const { 
    data: members = [], 
    isLoading, 
    error 
  } = useQuery({
    queryKey: [SPOTLIGHT_QUERY_KEYS.STORE_MEMBERS, storeId, searchTerm],
    queryFn: () => CommunityShowcaseAPI.searchStoreMembers(storeId, searchTerm),
    enabled: !!storeId && isValidSearchTerm(searchTerm),
    staleTime: 30 * 1000, // 30 seconds
  });

  /**
   * Update search term with validation
   */
  const updateSearchTerm = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  /**
   * Clear search term and results
   */
  const clearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);

  /**
   * Get search validation error
   */
  const searchError = useMemo(() => {
    return validateSearchTerm(searchTerm);
  }, [searchTerm]);

  return {
    searchTerm,
    setSearchTerm: updateSearchTerm,
    members,
    isLoading,
    error: error ? 'Failed to search members' : searchError,
    clearSearch,
  };
};

/**
 * Hook for debounced member search
 */
export const useDebouncedMemberSearch = (storeId: string, delay: number = SEARCH_CONFIG.DEBOUNCE_DELAY) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Debounce search term
  const updateSearchTerm = useCallback((term: string) => {
    setSearchTerm(term);
    
    const timeoutId = setTimeout(() => {
      setDebouncedSearchTerm(term);
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [delay]);

  // Use the main search hook with debounced term
  const searchResult = useMemberSearch(storeId);
  
  // Override the search term management
  return {
    ...searchResult,
    searchTerm,
    setSearchTerm: updateSearchTerm,
    debouncedSearchTerm,
  };
};

/**
 * Hook for local member filtering (when you already have members)
 */
export const useLocalMemberSearch = (members: StoreUser[]) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMembers = useMemo(() => {
    return filterMembersBySearch(members, searchTerm);
  }, [members, searchTerm]);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);

  return {
    searchTerm,
    setSearchTerm,
    members: filteredMembers,
    isLoading: false,
    error: null,
    clearSearch,
  };
};
