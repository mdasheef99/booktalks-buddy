import { useState, useMemo } from 'react';
import { BookAvailabilityRequestData } from '@/types/bookAvailabilityRequests';

interface UseRequestFiltersProps {
  requests: BookAvailabilityRequestData[];
  activeTab: 'all' | 'club_members' | 'anonymous';
}

export const useRequestFilters = ({ requests, activeTab }: UseRequestFiltersProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter requests based on active tab and search term
  const filteredRequests = useMemo(() => {
    let filtered = requests;

    // Filter by request source based on active tab
    if (activeTab === 'club_members') {
      filtered = filtered.filter(r => r.request_source === 'authenticated_user');
    } else if (activeTab === 'anonymous') {
      filtered = filtered.filter(r => r.request_source === 'anonymous');
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(request =>
        request.book_title.toLowerCase().includes(searchLower) ||
        request.book_author.toLowerCase().includes(searchLower) ||
        request.customer_name.toLowerCase().includes(searchLower) ||
        request.customer_email.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [requests, activeTab, searchTerm]);

  // Clear search
  const clearSearch = () => {
    setSearchTerm('');
  };

  // Get search results count
  const getSearchResultsCount = () => {
    return filteredRequests.length;
  };

  // Check if search is active
  const isSearchActive = searchTerm.trim().length > 0;

  return {
    searchTerm,
    setSearchTerm,
    filteredRequests,
    clearSearch,
    getSearchResultsCount,
    isSearchActive
  };
};
