/**
 * Books Navigation Hook
 * 
 * Section navigation and routing for Books Section
 */

import { useState } from 'react';

export type BooksSectionTab = 'search' | 'library' | 'store-requests' | 'collections';

export interface BooksNavigationState {
  activeTab: BooksSectionTab;
}

export interface BooksNavigationActions {
  setActiveTab: (tab: BooksSectionTab) => void;
  navigateToSearch: () => void;
  navigateToLibrary: () => void;
  navigateToStoreRequests: () => void;
  navigateToCollections: () => void;
}

export interface UseBooksNavigationReturn extends BooksNavigationState, BooksNavigationActions {}

export const useBooksNavigation = (initialTab: BooksSectionTab = 'search'): UseBooksNavigationReturn => {
  const [activeTab, setActiveTab] = useState<BooksSectionTab>(initialTab);

  const navigateToSearch = () => setActiveTab('search');
  const navigateToLibrary = () => setActiveTab('library');
  const navigateToStoreRequests = () => setActiveTab('store-requests');
  const navigateToCollections = () => setActiveTab('collections');

  return {
    // State
    activeTab,
    
    // Actions
    setActiveTab,
    navigateToSearch,
    navigateToLibrary,
    navigateToStoreRequests,
    navigateToCollections
  };
};
