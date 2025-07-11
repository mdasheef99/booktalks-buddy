/**
 * Books Search Hook
 * 
 * Search functionality and filters for Books Section
 */

import { useState } from 'react';
import { BookType } from '@/types/books';

export interface BooksSearchState {
  searchQuery: string;
  searchResults: BookType[];
  isSearching: boolean;
  searchError: string | null;
  selectedFilters: {
    category?: string;
    sortBy?: 'relevance' | 'newest' | 'oldest';
  };
}

export interface BooksSearchActions {
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: BookType[]) => void;
  setIsSearching: (loading: boolean) => void;
  setSearchError: (error: string | null) => void;
  updateFilters: (filters: Partial<BooksSearchState['selectedFilters']>) => void;
  clearSearch: () => void;
  resetFilters: () => void;
}

export interface UseBooksSearchReturn extends BooksSearchState, BooksSearchActions {}

export const useBooksSearch = (): UseBooksSearchReturn => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<BookType[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedFilters, setSelectedFilters] = useState<BooksSearchState['selectedFilters']>({
    category: undefined,
    sortBy: 'relevance'
  });

  const updateFilters = (filters: Partial<BooksSearchState['selectedFilters']>) => {
    setSelectedFilters(prev => ({ ...prev, ...filters }));
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSearchError(null);
    setIsSearching(false);
  };

  const resetFilters = () => {
    setSelectedFilters({
      category: undefined,
      sortBy: 'relevance'
    });
  };

  return {
    // State
    searchQuery,
    searchResults,
    isSearching,
    searchError,
    selectedFilters,
    
    // Actions
    setSearchQuery,
    setSearchResults,
    setIsSearching,
    setSearchError,
    updateFilters,
    clearSearch,
    resetFilters
  };
};
