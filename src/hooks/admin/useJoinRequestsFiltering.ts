import { useState, useEffect } from 'react';

interface JoinRequest {
  user_id: string;
  club_id: string;
  role: string;
  joined_at: string;
  club_name?: string;
  username?: string;
}

type SortField = 'date' | 'username' | 'club_name';
type SortOrder = 'asc' | 'desc';

interface Club {
  id: string;
  name: string;
}

export const useJoinRequestsFiltering = (requests: JoinRequest[]) => {
  // Sorting and filtering state
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filterClub, setFilterClub] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [availableClubs, setAvailableClubs] = useState<Club[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<JoinRequest[]>([]);

  // Extract unique clubs for filtering
  useEffect(() => {
    if (requests.length === 0) {
      setAvailableClubs([]);
      return;
    }

    const uniqueClubs = Array.from(new Set(requests.map(req => req.club_id)))
      .map(clubId => {
        const club = requests.find(req => req.club_id === clubId);
        return { id: clubId, name: club?.club_name || 'Unknown Club' };
      });

    setAvailableClubs(uniqueClubs);
  }, [requests]);

  // Apply sorting and filtering
  useEffect(() => {
    if (requests.length === 0) {
      setFilteredRequests([]);
      return;
    }

    let result = [...requests];

    // Apply club filter
    if (filterClub !== 'all') {
      result = result.filter(req => req.club_id === filterClub);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(req =>
        (req.username?.toLowerCase().includes(query)) ||
        (req.club_name?.toLowerCase().includes(query))
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;

      if (sortField === 'date') {
        comparison = new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime();
      } else if (sortField === 'username') {
        comparison = (a.username || '').localeCompare(b.username || '');
      } else if (sortField === 'club_name') {
        comparison = (a.club_name || '').localeCompare(b.club_name || '');
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredRequests(result);
  }, [requests, sortField, sortOrder, filterClub, searchQuery]);

  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setFilterClub('all');
    setSortField('date');
    setSortOrder('desc');
  };

  return {
    sortField,
    setSortField,
    sortOrder,
    toggleSortOrder,
    filterClub,
    setFilterClub,
    searchQuery,
    setSearchQuery,
    availableClubs,
    filteredRequests,
    clearFilters
  };
};
