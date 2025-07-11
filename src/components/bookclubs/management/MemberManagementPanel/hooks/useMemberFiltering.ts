/**
 * useMemberFiltering Hook
 * Handles search and filtering logic for members and join requests
 */

import { useState, useEffect, useMemo } from 'react';
import { filterMembers, filterJoinRequests } from '../utils/memberDataProcessing';
import type { Member, JoinRequest } from '../types/memberManagement';

interface UseMemberFilteringProps {
  members: Member[];
  joinRequests: JoinRequest[];
}

interface UseMemberFilteringReturn {
  searchQuery: string;
  filteredMembers: Member[];
  filteredRequests: JoinRequest[];
  activeTab: string;
  setSearchQuery: (query: string) => void;
  setActiveTab: (tab: string) => void;
  clearSearch: () => void;
}

export function useMemberFiltering({ 
  members, 
  joinRequests 
}: UseMemberFilteringProps): UseMemberFilteringReturn {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('members');

  // Memoized filtered results for performance
  const filteredMembers = useMemo(() => {
    return filterMembers(members, searchQuery);
  }, [members, searchQuery]);

  const filteredRequests = useMemo(() => {
    return filterJoinRequests(joinRequests, searchQuery);
  }, [joinRequests, searchQuery]);

  const clearSearch = () => {
    setSearchQuery('');
  };

  return {
    searchQuery,
    filteredMembers,
    filteredRequests,
    activeTab,
    setSearchQuery,
    setActiveTab,
    clearSearch
  };
}
