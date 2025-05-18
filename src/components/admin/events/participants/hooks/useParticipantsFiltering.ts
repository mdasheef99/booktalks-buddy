import { useState, useEffect, useMemo } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { Participant, RsvpStatus } from '../types';

/**
 * Hook for managing participant filtering and pagination
 */
export function useParticipantsFiltering(participants: Participant[]) {
  // State for UI controls
  const [activeTab, setActiveTab] = useState<RsvpStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Debounce search query to avoid excessive filtering
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, activeTab]);

  // Memoized filtered participants based on active tab and search query
  const filteredParticipants = useMemo(() => {
    return participants.filter(
      (participant) =>
        // Filter by tab
        (activeTab === 'all' || participant.rsvp_status === activeTab) &&
        // Filter by search query (case insensitive)
        (debouncedSearchQuery === '' ||
          (participant.user.username &&
           participant.user.username.toLowerCase().includes(debouncedSearchQuery.toLowerCase())) ||
          participant.user.email.toLowerCase().includes(debouncedSearchQuery.toLowerCase()))
    );
  }, [participants, activeTab, debouncedSearchQuery]);

  return {
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    debouncedSearchQuery,
    itemsPerPage,
    setItemsPerPage,
    currentPage,
    setCurrentPage,
    filteredParticipants
  };
}
